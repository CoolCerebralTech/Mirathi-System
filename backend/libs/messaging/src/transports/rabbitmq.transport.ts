import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { connect, Connection, Channel, Message } from 'amqplib';
import { ShambaConfigService } from '@shamba/config';
import { RabbitMQConfig, ConnectionStatus, RetryConfig } from '../interfaces/messaging.interface';
import { EventType } from '@shamba/common';

@Injectable()
export class RabbitMQTransport implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQTransport.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;

  public status: ConnectionStatus = {
    isConnected: false,
    stats: {
      messagesPublished: 0,
      messagesConsumed: 0,
      errors: 0,
    },
  };

  private readonly retryConfig: RetryConfig = {
    maxAttempts: 5,
    delay: 2000,
    backoffMultiplier: 2,
    maxDelay: 30000,
  };

  constructor(private configService: ShambaConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.connection) {
      return;
    }

    this.isConnecting = true;

    try {
      const config = this.configService.messaging;
      
      this.connection = await connect(config.rabbitMqUri);
      this.channel = await this.connection.createChannel();
      
      // Set up exchange and queues
      await this.setupInfrastructure();

      this.connection.on('close', () => this.handleConnectionClose());
      this.connection.on('error', (error) => this.handleConnectionError(error));

      this.status.isConnected = true;
      this.status.lastConnectionTime = new Date();
      this.reconnectAttempts = 0;

      this.logger.log('RabbitMQ connection established');
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      this.status.error = error.message;
      this.status.stats.errors++;
      
      this.logger.error('Failed to connect to RabbitMQ', error);
      await this.handleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.status.isConnected = false;
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    const config = this.configService.messaging;

    // Assert main exchange
    await this.channel.assertExchange(config.exchange, 'topic', {
      durable: true,
      autoDelete: false,
    });

    // Assert dead letter exchange
    const deadLetterExchange = `${config.exchange}.dead`;
    await this.channel.assertExchange(deadLetterExchange, 'topic', {
      durable: true,
      autoDelete: false,
    });

    // Assert dead letter queue
    await this.channel.assertQueue(config.queues.deadLetter, {
      durable: true,
      deadLetterExchange: deadLetterExchange,
    });

    // Bind dead letter queue
    await this.channel.bindQueue(config.queues.deadLetter, deadLetterExchange, '#');

    // Assert and bind service queues
    const queues = [
      { name: config.queues.userEvents, patterns: ['user.*', 'auth.*'] },
      { name: config.queues.documentEvents, patterns: ['document.*'] },
      { name: config.queues.notificationEvents, patterns: ['notification.*', 'email.*', 'sms.*'] },
      { name: config.queues.auditEvents, patterns: ['audit.*', '*.created', '*.updated', '*.deleted'] },
    ];

    for (const queue of queues) {
      await this.channel.assertQueue(queue.name, {
        durable: true,
        deadLetterExchange: deadLetterExchange,
        deadLetterRoutingKey: queue.name,
      });

      for (const pattern of queue.patterns) {
        await this.channel.bindQueue(queue.name, config.exchange, pattern);
      }
    }

    this.logger.log('RabbitMQ infrastructure setup completed');
  }

  async publish(
    eventType: EventType,
    payload: any,
    options: PublishOptions = {},
  ): Promise<boolean> {
    if (!this.channel || !this.status.isConnected) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      const routingKey = this.getRoutingKey(eventType);

      const success = this.channel.publish(
        this.configService.messaging.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: options.persistent ?? true,
          priority: options.priority,
          expiration: options.expiration,
          headers: {
            ...options.headers,
            'x-event-type': eventType,
            'x-timestamp': new Date().toISOString(),
            'x-source': 'shamba-sure',
          },
        },
      );

      if (success) {
        this.status.stats.messagesPublished++;
      } else {
        this.logger.warn(`Message not published for event: ${eventType}`);
      }

      return success;
    } catch (error) {
      this.status.stats.errors++;
      this.logger.error(`Failed to publish message for event: ${eventType}`, error);
      throw error;
    }
  }

  async subscribe(
    queue: string,
    pattern: string,
    handler: (message: any) => Promise<void>,
    options: SubscribeOptions = {},
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      // Assert queue with options
      await this.channel.assertQueue(queue, {
        durable: options.durable ?? true,
        exclusive: options.exclusive ?? false,
        autoDelete: options.autoDelete ?? false,
        deadLetterExchange: options.deadLetterExchange,
      });

      // Bind queue to pattern
      await this.channel.bindQueue(queue, this.configService.messaging.exchange, pattern);

      // Set prefetch if specified
      if (options.prefetch) {
        await this.channel.prefetch(options.prefetch);
      }

      // Consume messages
      await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel!.ack(msg);
          this.status.stats.messagesConsumed++;
        } catch (error) {
          this.logger.error(`Error processing message from queue ${queue}`, error);
          this.channel!.nack(msg, false, false); // Don't requeue
          this.status.stats.errors++;
        }
      }, {
        noAck: false,
      });

      this.logger.log(`Subscribed to queue ${queue} with pattern ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to queue ${queue}`, error);
      throw error;
    }
  }

  private getRoutingKey(eventType: EventType): string {
    // Convert event type to routing key pattern
    // e.g., "user.created" -> "user.created"
    return eventType;
  }

  private handleConnectionClose(): void {
    this.logger.warn('RabbitMQ connection closed');
    this.status.isConnected = false;
    this.handleReconnect();
  }

  private handleConnectionError(error: Error): void {
    this.logger.error('RabbitMQ connection error', error);
    this.status.error = error.message;
    this.status.stats.errors++;
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.retryConfig.maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.retryConfig.delay * Math.pow(this.retryConfig.backoffMultiplier, this.reconnectAttempts - 1),
      this.retryConfig.maxDelay,
    );

    this.logger.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('Reconnection attempt failed', error);
      });
    }, delay);
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  async healthCheck(): Promise<{ status: string; details: string }> {
    if (!this.status.isConnected) {
      return { status: 'error', details: 'Not connected to RabbitMQ' };
    }

    try {
      // Try to create a test channel to verify connection health
      const testChannel = await this.connection!.createChannel();
      await testChannel.close();
      
      return { status: 'ok', details: 'RabbitMQ connection is healthy' };
    } catch (error) {
      return { status: 'error', details: `RabbitMQ health check failed: ${error.message}` };
    }
  }
}