/**
 * Defines the names for our primary RabbitMQ exchanges.
 * Using an enum prevents typos in configuration and code.
 */
export declare enum Exchange {
    SHAMBA_EVENTS = "shamba.events.topic"
}
/**
 * Defines the names of the queues used by our services.
 * Following a `service-name.events` convention is recommended.
 */
export declare enum Queue {
    SUCCESSION_EVENTS = "succession.events",
    NOTIFICATIONS_EVENTS = "notifications.events",
    AUDITING_EVENTS = "auditing.events"
}
/**
 * Defines the required configuration for the RabbitMQ client in our services.
 * This aligns with the options expected by `@nestjs/microservices`.
 */
export interface RabbitMQConfig {
    /** The RabbitMQ connection URI. */
    uri: string;
    /** The primary exchange for publishing events. */
    exchange: Exchange;
    /**
     * The name of the queue this service will consume from.
     * This is optional because some services (like the API Gateway)
     * may only publish events and not consume them.
     */
    queue?: Queue;
}
/**
 * Defines the options for publishing an event.
 * This is a simplified set of the most common AMQP options.
 */
export interface PublishOptions {
    /**
     * A unique ID for tracing a request's flow across multiple services.
     * If provided, it will be attached to the event payload.
     */
    correlationId?: string;
    /**
     * A time-to-live for the message, in milliseconds.
     * Example: 60000 for 1 minute.
     */
    expiration?: number;
}
/**
 * A simplified interface representing the health status of the message broker connection.
 */
export interface BrokerHealth {
    /** Indicates if the client is currently connected to RabbitMQ. */
    isConnected: boolean;
    /** The error message if the connection is down. */
    error?: string;
}
//# sourceMappingURL=messaging.interface.d.ts.map