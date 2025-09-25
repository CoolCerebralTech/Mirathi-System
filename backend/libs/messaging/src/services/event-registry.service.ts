import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { MessagingService } from './messaging.service';
import { getEventHandlers } from '../decorators/event-handler.decorator';

@Injectable()
export class EventRegistryService implements OnModuleInit {
  private readonly logger = new Logger(EventRegistryService.name);
  private registeredConsumers: any[] = [];

  constructor(private messagingService: MessagingService) {}

  registerConsumer(consumer: any): void {
    this.registeredConsumers.push(consumer);
  }

  async onModuleInit() {
    await this.setupEventHandlers();
  }

  private async setupEventHandlers(): Promise<void> {
    for (const consumer of this.registeredConsumers) {
      const handlers = getEventHandlers(consumer.constructor);

      for (const handler of handlers) {
        const method = consumer[handler.methodName].bind(consumer);
        
        await this.messagingService.subscribe(
          handler.eventType,
          async (data: any, envelope: any) => {
            try {
              await method(data, envelope);
            } catch (error) {
              this.logger.error(
                `Error in event handler ${String(handler.methodName)} for ${handler.eventType}`,
                error,
              );
              throw error;
            }
          },
          handler.options,
        );

        this.logger.log(`Registered event handler: ${handler.eventType} -> ${String(handler.methodName)}`);
      }
    }
  }

  getRegisteredEvents(): EventType[] {
    const events: EventType[] = [];
    
    for (const consumer of this.registeredConsumers) {
      const handlers = getEventHandlers(consumer.constructor);
      events.push(...handlers.map(h => h.eventType));
    }
    
    return [...new Set(events)]; // Remove duplicates
  }
}