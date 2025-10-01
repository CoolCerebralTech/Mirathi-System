"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let MessagingService = MessagingService_1 = class MessagingService {
    client;
    logger = new common_1.Logger(MessagingService_1.name);
    isConnected = false;
    constructor(client) {
        this.client = client;
    }
    async onModuleInit() {
        try {
            this.logger.log('Connecting to message broker...');
            await this.client.connect();
            this.isConnected = true;
            this.logger.log('Successfully connected to the message broker.');
        }
        catch (error) { // Explicitly type error as unknown
            this.isConnected = false;
            // --- THE FIX IS HERE ---
            // We safely check the type of the error before accessing .message
            let errorMessage = 'An unknown error occurred';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
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
    emit(event, options) {
        if (!this.isConnected) {
            this.logger.error(`Cannot emit event. Not connected to broker. Event: ${event.type}`);
            return;
        }
        this.client.emit(event.type, {
            ...event,
            correlationId: options?.correlationId,
        });
        this.logger.debug(`Event emitted: ${event.type}`);
    }
    getHealth() {
        if (this.isConnected) {
            return { isConnected: true };
        }
        return {
            isConnected: false,
            error: 'Client is not connected to the message broker.',
        };
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('RABBITMQ_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map