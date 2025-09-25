import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, ShambaEvent } from '@shamba/common';
import { MessagingService } from '../services/messaging.service';
import { SubscribeOptions, MessageEnvelope } from '../interfaces/messaging.interface';

@Injectable()
export abstract class BaseConsumer implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);
  private subscribed = false;

  constructor(protected messagingService: MessagingService) {}

  async onModuleInit() {
    if (!this.subscribed) {
      await this.subscribeToEvents();
      this.subscribed = true;
    }
  }

  protected abstract getEventHandlers(): Array<{
    eventType: EventType;
    handler: (data: any, envelope: MessageEnvelope) => Promise<void>;
    options?: SubscribeOptions;
  }>;

  private async subscribeToEvents(): Promise<void> {
    const handlers = this.getEventHandlers();

    for (const { eventType, handler, options } of handlers) {
      try {
        await this.messagingService.subscribe(eventType, handler, options);
        this.logger.log(`Successfully subscribed to ${eventType}`);
      } catch (error) {
        this.logger.error(`Failed to subscribe to ${eventType}`, error);
        // You might want to implement retry logic here
      }
    }
  }

  protected handleError(error: Error, eventType: EventType, envelope: MessageEnvelope): void {
    this.logger.error(`Error processing ${eventType} [${envelope.id}]`, error);
    
    // You could implement dead letter queue handling here
    // or trigger alerting/monitoring
  }
}