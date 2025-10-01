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
exports.NotificationResponseDto = exports.NotificationQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../enums");
const base_response_dto_1 = require("../shared/base.response.dto");
const pagination_dto_1 = require("../shared/pagination.dto");
// ============================================================================
// ARCHITECTURAL NOTE: The Role of this File
// ============================================================================
// While the `notifications-service` is primarily event-driven, it will expose
// endpoints for users to retrieve their notification history. This file defines
// the contracts for those read-only operations.
// ============================================================================
// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================
/**
 * Defines the query parameters for filtering a list of notifications.
 */
class NotificationQueryDto extends pagination_dto_1.PaginationQueryDto {
    status;
    channel;
}
exports.NotificationQueryDto = NotificationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter notifications by their delivery status.',
        enum: enums_1.NotificationStatus,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.NotificationStatus),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter notifications by the channel they were sent through.',
        enum: enums_1.NotificationChannel,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.NotificationChannel),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "channel", void 0);
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================
/**
 * Defines the shape of a single Notification object returned by the API.
 */
class NotificationResponseDto extends base_response_dto_1.BaseResponseDto {
    channel = "EMAIL";
    status = "PENDING";
    sentAt;
    failReason;
    recipientId;
    templateName; // We expose the name, not the full template body
}
exports.NotificationResponseDto = NotificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.NotificationChannel,
        description: 'The channel through which the notification was sent (e.g., EMAIL, SMS).',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.NotificationStatus,
        description: 'The delivery status of the notification.',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The timestamp when the notification was successfully sent.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], NotificationResponseDto.prototype, "sentAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The reason for a delivery failure, if any.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], NotificationResponseDto.prototype, "failReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the user who received the notification.',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "recipientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The name of the template used for this notification (e.g., "WELCOME_EMAIL").',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "templateName", void 0);
//# sourceMappingURL=notification.dto.js.map