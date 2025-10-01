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
exports.DocumentResponseDto = exports.DocumentVersionResponseDto = exports.DocumentQueryDto = exports.UpdateDocumentRequestDto = exports.InitiateDocumentUploadRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../enums");
const base_response_dto_1 = require("../shared/base.response.dto");
const pagination_dto_1 = require("../shared/pagination.dto");
// ============================================================================
// ARCHITECTURAL NOTE: File Uploads
// ============================================================================
// The DTO for the initial file upload endpoint is intentionally minimal.
// Metadata like filename, size, and MIME type should be derived from the
// file stream on the server-side (`@UploadedFile()` in NestJS) rather than
// trusted from client input. This is a critical security measure.
// The DTO may contain IDs for related entities, like an Asset or a Will.
// ============================================================================
// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================
class InitiateDocumentUploadRequestDto {
    assetId;
}
exports.InitiateDocumentUploadRequestDto = InitiateDocumentUploadRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The ID of an asset this document is related to.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitiateDocumentUploadRequestDto.prototype, "assetId", void 0);
class UpdateDocumentRequestDto {
    filename;
    // Note: Only specific roles (e.g., an Admin or a verification service)
    // should be allowed to change the document status.
    status;
}
exports.UpdateDocumentRequestDto = UpdateDocumentRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'A new, user-friendly name for the document.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateDocumentRequestDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The new verification status of the document.',
        enum: enums_1.DocumentStatus,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.DocumentStatus),
    __metadata("design:type", String)
], UpdateDocumentRequestDto.prototype, "status", void 0);
/**
 * Defines the query parameters for filtering a list of documents.
 */
class DocumentQueryDto extends pagination_dto_1.PaginationQueryDto {
    status;
    uploaderId;
}
exports.DocumentQueryDto = DocumentQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter documents by their verification status.',
        enum: enums_1.DocumentStatus,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.DocumentStatus),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter documents by the ID of the user who uploaded them.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "uploaderId", void 0);
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================
class DocumentVersionResponseDto extends base_response_dto_1.BaseResponseDto {
    versionNumber;
    storagePath;
    changeNote;
    documentId;
}
exports.DocumentVersionResponseDto = DocumentVersionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The sequential version number of this document record.' }),
    __metadata("design:type", Number)
], DocumentVersionResponseDto.prototype, "versionNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The path to the file in the storage system (e.g., an S3 key).' }),
    __metadata("design:type", String)
], DocumentVersionResponseDto.prototype, "storagePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'A note describing the change in this version.' }),
    __metadata("design:type", String)
], DocumentVersionResponseDto.prototype, "changeNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the parent document.' }),
    __metadata("design:type", String)
], DocumentVersionResponseDto.prototype, "documentId", void 0);
class DocumentResponseDto extends base_response_dto_1.BaseResponseDto {
    filename;
    storagePath;
    mimeType;
    sizeBytes;
    status = "PENDING_VERIFICATION";
    uploaderId;
    versions;
}
exports.DocumentResponseDto = DocumentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The user-friendly name of the document.' }),
    __metadata("design:type", String)
], DocumentResponseDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The path to the current version of the file in storage.' }),
    __metadata("design:type", String)
], DocumentResponseDto.prototype, "storagePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The MIME type of the uploaded file.', example: 'application/pdf' }),
    __metadata("design:type", String)
], DocumentResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The size of the file in bytes.', example: 1024768 }),
    __metadata("design:type", Number)
], DocumentResponseDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.DocumentStatus, description: 'The current verification status.' }),
    __metadata("design:type", String)
], DocumentResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the user who uploaded the document.' }),
    __metadata("design:type", String)
], DocumentResponseDto.prototype, "uploaderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'A list of all historical versions of this document.',
        type: [DocumentVersionResponseDto],
    }),
    __metadata("design:type", Array)
], DocumentResponseDto.prototype, "versions", void 0);
//# sourceMappingURL=documents.dto.js.map