import { EventType } from '../../enums';

export interface BaseEvent {
  type: EventType;
  timestamp: Date;
  version: string;
  source: string;
  correlationId?: string;
}

export interface UserCreatedEvent extends BaseEvent {
  type: EventType.USER_CREATED;
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  type: EventType.USER_UPDATED;
  data: {
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export interface WillCreatedEvent extends BaseEvent {
  type: EventType.WILL_CREATED;
  data: {
    willId: string;
    testatorId: string;
    title: string;
    status: string;
  };
}

export interface DocumentUploadedEvent extends BaseEvent {
  type: EventType.DOCUMENT_UPLOADED;
  data: {
    documentId: string;
    uploaderId: string;
    filename: string;
    status: string;
  };
}

export interface NotificationEvent extends BaseEvent {
  type: EventType.NOTIFICATION_SENT;
  data: {
    notificationId: string;
    recipientId: string;
    channel: string;
    status: string;
    template: string;
  };
}

// Union type for all events
export type ShambaEvent = 
  | UserCreatedEvent
  | UserUpdatedEvent
  | WillCreatedEvent
  | DocumentUploadedEvent
  | NotificationEvent;