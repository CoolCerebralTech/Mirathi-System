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
exports.BaseResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
// ============================================================================
// ARCHITECTURAL NOTE: The Role of this File
// ============================================================================
// This file defines the base shape for API *response* DTOs. These classes are
// not used for input validation (e.g., in request bodies). Their purpose is to
// provide a consistent structure and clear API documentation for the data
// our services return to clients.
//
// The `AuditableDto` has been intentionally REMOVED. Our current Prisma schema
// does not include `createdBy` or `updatedBy` fields on the core models. A DTO
// in this shared library MUST accurately represent the data contract of our
// system. If we decide to add these auditing fields to our database models in
// the future, we can re-introduce a corresponding DTO at that time.
// This prevents a mismatch between our API contract and the actual data.
// ============================================================================
class BaseResponseDto {
    id;
    createdAt;
    updatedAt;
}
exports.BaseResponseDto = BaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The unique identifier for the resource.',
        example: 'clq1a2b3c0000d4e5f6g7h8i9',
        type: String,
    }),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ISO 8601 timestamp when the resource was created.',
        example: '2023-12-01T10:00:00.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], BaseResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ISO 8601 timestamp when the resource was last updated.',
        example: '2023-12-01T11:30:00.000Z',
        type: Date,
    }),
    __metadata("design:type", Date)
], BaseResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=base.response.dto.js.map