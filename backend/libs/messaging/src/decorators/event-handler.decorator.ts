import { SetMetadata } from '@nestjs/common';
import { EventType } from '@shamba/common';

export const EVENT_HANDLER_METADATA = 'event_handler';

export interface EventHandlerOptions {
  queue?: string;
  prefetch?: number;
  durable?: boolean;
}

export function EventHandler(
  eventType: EventType,
  options: EventHandlerOptions = {},
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const handlers = Reflect.getMetadata(EVENT_HANDLER_METADATA, target.constructor) || [];
    
    handlers.push({
      eventType,
      methodName: propertyKey,
      options,
    });

    Reflect.defineMetadata(EVENT_HANDLER_METADATA, handlers, target.constructor);
  };
}

export function getEventHandlers(target: any): Array<{
  eventType: EventType;
  methodName: string | symbol;
  options: EventHandlerOptions;
}> {
  return Reflect.getMetadata(EVENT_HANDLER_METADATA, target) || [];
}