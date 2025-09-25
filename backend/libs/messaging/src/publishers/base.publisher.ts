import { Injectable } from '@nestjs/common';
import { EventType, ShambaEvent } from '@shamba/common';
import { MessagingService } from '../services/messaging.service';
import { PublishOptions } from '../interfaces/messaging.interface';

@Injectable()
export abstract class BasePublisher {
  constructor(protected messagingService: MessagingService) {}

  protected async publishEvent<T extends ShambaEvent>(
    eventType: EventType,
    payload: T['data'],
    options: PublishOptions = {},
  ): Promise<void> {
    await this.messagingService.publish(eventType, payload, options);
  }

  protected async publishEvents<T extends ShambaEvent>(
    events: Array<{ type: EventType; payload: T['data'] }>,
    options: PublishOptions = {},
  ): Promise<void> {
    for (const event of events) {
      await this.publishEvent(event.type, event.payload, options);
    }
  }
}