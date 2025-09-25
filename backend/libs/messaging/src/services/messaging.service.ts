import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventType, ShambaEvent } from '@shamba/common';
import { RabbitMQTransport } from '../transports/rabbitmq.transport';
import { MessageEnvelope, PublishOptions, SubscribeOptions } from '../interfaces/messaging.interface';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);
  private messageHandlers: Map<EventType, Function[]> = new Map();

  constructor(private transport: RabbitMQTransport) {}

  async onModuleInit() {
    // Wait for transport to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async publish<T extends ShambaEvent>(
    eventType: EventType,
    payload: T['data'],
    options: PublishOptions = {},
    correlationId?: string,
  ): Promise<void> {
    const envelope: MessageEnvelope<T['data']> = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date(),
      version: '1.0',
      source: 'shamba-sure',
      correlationId,
      payload,
      metadata: {
        publishedBy: process.env.SERVICE_NAME || 'unknown',
      },
    };

    try {
      const success = await this.transport.publish(eventType, envelope, options);
      
      if (!success) {
        throw new Error(`Failed to publish event: ${eventType}`);
      }

      this.logger.debug(`Event published: ${eventType} [${envelope.id}]`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${eventType}`, error);
      throw error;
    }
  }

  async subscribe<T extends ShambaEvent>(
    eventType: EventType,
    handler: (data: T['data'], envelope: MessageEnvelope<T['data']>) => Promise<void>,
    options: SubscribeOptions = {},
  ): Promise<void> {
    const queueName = options.queue || this.getDefaultQueueName(eventType);

    try {
      await this.transport.subscribe(
        queueName,
        eventType,
        async (envelope: MessageEnvelope<T['data']>) => {
          this.logger.debug(`Event received: ${eventType} [${envelope.id}]`);
          
          try {
            await handler(envelope.payload, envelope);
            this.logger.debug(`Event processed successfully: ${eventType} [${envelope.id}]`);
          } catch (error) {
            this.logger.error(`Error processing event: ${eventType} [${envelope.id}]`, error);
            throw error; // This will trigger nack
          }
        },
        options,
      );

      this.logger.log(`Subscribed to event: ${eventType} on queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to event: ${eventType}`, error);
      throw error;
    }
  }

  async request<T = any, R = any>(
    eventType: EventType,
    payload: T,
    timeout: number = 30000,
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const correlationId = uuidv4();
      const responseEvent = `${eventType}.response`;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeoutId);
        // Unsubscribe from response event
      };

      // Subscribe to response
      this.subscribe(
        responseEvent as EventType,
        (response: R, envelope: MessageEnvelope) => {
          if (envelope.correlationId === correlationId) {
            cleanup();
            resolve(response);
          }
        },
        { autoDelete: true, exclusive: true },
      ).catch(reject);

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timeout for event: ${eventType}`));
      }, timeout);

      // Publish request
      this.publish(eventType, payload, {}, correlationId).catch(reject);
    });
  }

  async reply<T = any>(
    originalEnvelope: MessageEnvelope,
    response: T,
  ): Promise<void> {
    const responseEvent = `${originalEnvelope.type}.response` as EventType;
    
    await this.publish(
      responseEvent,
      response,
      {},
      originalEnvelope.id, // Use original ID as correlation ID
    );
  }

  async broadcast<T extends ShambaEvent>(
    eventType: EventType,
    payload: T['data'],
  ): Promise<void> {
    // For broadcast, we might use a fanout exchange
    await this.publish(eventType, payload, { persistent: false });
  }

  private getDefaultQueueName(eventType: EventType): string {
    const serviceName = process.env.SERVICE_NAME || 'unknown';
    const eventCategory = eventType.split('.')[0];
    return `${serviceName}.${eventCategory}.queue`;
  }

  getConnectionStatus() {
    return this.transport.getStatus();
  }

  async healthCheck() {
    return this.transport.healthCheck();
  }

  // Batch operations
  async publishBatch<T extends ShambaEvent>(
    events: Array<{ type: EventType; payload: T['data'] }>,
    options: PublishOptions = {},
  ): Promise<void> {
    for (const event of events) {
      await this.publish(event.type, event.payload, options);
    }
  }

  // Utility methods
  async waitForConnection(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.transport.getStatus().isConnected) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Messaging service connection timeout');
  }

  async purgeQueue(queue: string): Promise<void> {
    // Implementation would depend on the transport
    this.logger.warn(`Queue purge requested for: ${queue}`);
  }
}