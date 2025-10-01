"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = exports.Exchange = void 0;
// ============================================================================
// ARCHITECTURAL NOTE: Leveraging NestJS Microservices
// ============================================================================
// This library provides a simplified interface for interacting with our
// event-driven architecture. We rely heavily on the abstractions provided by
// `@nestjs/microservices` to handle connections, retries, ACKs/NACKs, and
// dead-lettering.
//
// Our interfaces are therefore focused on the *application-level* contracts,
// such as the structure of our event payloads and the required configuration,
// rather than low-level RabbitMQ client options.
// ============================================================================
/**
 * Defines the names for our primary RabbitMQ exchanges.
 * Using an enum prevents typos in configuration and code.
 */
var Exchange;
(function (Exchange) {
    Exchange["SHAMBA_EVENTS"] = "shamba.events.topic";
})(Exchange || (exports.Exchange = Exchange = {}));
/**
 * Defines the names of the queues used by our services.
 * Following a `service-name.events` convention is recommended.
 */
var Queue;
(function (Queue) {
    Queue["SUCCESSION_EVENTS"] = "succession.events";
    Queue["NOTIFICATIONS_EVENTS"] = "notifications.events";
    Queue["AUDITING_EVENTS"] = "auditing.events";
    // Each queue will have a corresponding dead-letter queue (DLQ)
    // configured automatically by our MessagingService.
})(Queue || (exports.Queue = Queue = {}));
//# sourceMappingURL=messaging.interface.js.map