"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MessagingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("../../config/src");
const messaging_service_1 = require("./messaging.service");
const messaging_interface_1 = require("./interfaces/messaging.interface");
// ============================================================================
// Shamba Sure - Shared Messaging Module
// ============================================================================
// This module provides a standardized way for our microservices to connect
// to RabbitMQ and publish events. It uses a dynamic `register()` method
// to allow each consuming service to specify its own unique queue.
// ============================================================================
let MessagingModule = MessagingModule_1 = class MessagingModule {
    /**
     * Configures the MessagingModule for a specific service.
     * This is the entry point for using the messaging system.
     *
     * @param config An object containing the queue name for the service.
     */
    static register(config) {
        // This provider is responsible for creating and configuring the NestJS
        // RabbitMQ client (ClientProxy). It injects the ConfigService to get
        // the RabbitMQ URI from our environment variables.
        const rabbitMqClientProvider = {
            provide: 'RABBITMQ_CLIENT',
            useFactory: (configService) => {
                return microservices_1.ClientProxyFactory.create({
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [configService.get('RABBITMQ_URI')],
                        exchange: messaging_interface_1.Exchange.SHAMBA_EVENTS,
                        exchangeType: 'topic',
                        // The queue name provided by the specific microservice
                        queue: config.queue,
                        persistent: true, // Ensures messages survive a broker restart
                        queueOptions: {
                            durable: true, // The queue itself will survive a broker restart
                            // This is the CRITICAL part for resilience. If a message
                            // processing fails, it will be sent to a dead-letter exchange.
                            deadLetterExchange: 'shamba.events.dead',
                            // The failed message will be routed in the DLX with its original
                            // queue name, making it easy to inspect.
                            deadLetterRoutingKey: config.queue,
                        },
                        // Ensure messages are not acknowledged automatically.
                        // The framework will handle ACK/NACK based on whether the
                        // @EventPattern handler throws an error.
                        noAck: false,
                    },
                });
            },
            inject: [config_1.ConfigService],
        };
        return {
            // This makes the module dynamic
            module: MessagingModule_1,
            // Provide the MessagingService itself and our configured client
            providers: [messaging_service_1.MessagingService, rabbitMqClientProvider],
            // Export ONLY the MessagingService. The client is an internal detail.
            exports: [messaging_service_1.MessagingService],
        };
    }
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = MessagingModule_1 = __decorate([
    (0, common_1.Module)({})
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map