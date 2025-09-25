import { EventType, ShambaEvent } from '@shamba/common';

export interface MessageEnvelope<T = any> {
  id: string;
  type: EventType;
  timestamp: Date;
  version: string;
  source: string;
  correlationId?: string;
  payload: T;
  metadata?: Record<string, any>;
}

export interface MessageHandler<T = any> {
  pattern: EventType;
  handler: (data: MessageEnvelope<T>) => Promise<void>;
}

export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  headers?: Record<string, any>;
}

export interface SubscribeOptions {
  queue?: string;
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  prefetch?: number;
  deadLetterExchange?: string;
}

export interface RabbitMQConfig {
  uri: string;
  exchange: string;
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers';
  queues: {
    userEvents: string;
    documentEvents: string;
    notificationEvents: string;
    auditEvents: string;
    deadLetter: string;
  };
  reconnectDelay: number;
  maxRetries: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnectionTime?: Date;
  error?: string;
  stats: {
    messagesPublished: number;
    messagesConsumed: number;
    errors: number;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}