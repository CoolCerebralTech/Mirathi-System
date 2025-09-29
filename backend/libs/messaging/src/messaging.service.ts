import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ShambaEvent } from '@shamba/common';
import { BrokerHealth, PublishOptions } from './interfaces/messaging.interface';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private isConnected = false;

  constructor(@Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      this.logger.log('Connecting to message broker...');
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to the message broker.');
    } catch (error: unknown) { // Explicitly type error as unknown
      this.isConnected = false;

      // --- THE FIX IS HERE ---
      // We safely check the type of the error before accessing .message
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      // -----------------------

      this.logger.error('Failed to connect to the message broker.', errorMessage);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from message broker...');
    await this.client.close();
    this.isConnected = false;
  }

  emit<T extends ShambaEvent>(event: T, options?: PublishOptions): void {
    if (!this.isConnected) {
      this.logger.error(
        `Cannot emit event. Not connected to broker. Event: ${event.type}`,
      );
      return;
    }

    this.client.emit(event.type, {
      ...event,
      correlationId: options?.correlationId,
    });

    this.logger.debug(`Event emitted: ${event.type}`);
  }

  getHealth(): BrokerHealth {
    if (this.isConnected) {
      return { isConnected: true };
    }
    return {
      isConnected: false,
      error: 'Client is not connected to the message broker.',
    };
  }
}