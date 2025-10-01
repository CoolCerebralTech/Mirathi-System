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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const messaging_1 = require("../../../messaging/src");
let MessagingHealthIndicator = class MessagingHealthIndicator extends terminus_1.HealthIndicator {
    messagingService;
    key = 'message_broker';
    constructor(messagingService) {
        super();
        this.messagingService = messagingService;
    }
    async isHealthy() {
        const brokerHealth = this.messagingService.getHealth();
        const isHealthy = brokerHealth.isConnected;
        const result = this.getStatus(this.key, isHealthy, { details: brokerHealth.error });
        if (isHealthy) {
            return result;
        }
        throw new terminus_1.HealthCheckError('Message broker health check failed', result);
    }
};
exports.MessagingHealthIndicator = MessagingHealthIndicator;
exports.MessagingHealthIndicator = MessagingHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [messaging_1.MessagingService])
], MessagingHealthIndicator);
//# sourceMappingURL=messaging-health.indicator.js.map