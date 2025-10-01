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
exports.FamilyResponseDto = exports.FamilyMemberResponseDto = exports.WillResponseDto = exports.BeneficiaryAssignmentResponseDto = exports.AssetResponseDto = exports.AddFamilyMemberRequestDto = exports.CreateFamilyRequestDto = exports.AssignBeneficiaryRequestDto = exports.CreateAssetRequestDto = exports.UpdateWillRequestDto = exports.UpdateAssetRequestDto = exports.CreateWillRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../enums");
const base_response_dto_1 = require("../shared/base.response.dto");
const user_dto_1 = require("../users/user.dto");
// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================
class CreateWillRequestDto {
    title;
    status = enums_1.WillStatus.DRAFT;
}
exports.CreateWillRequestDto = CreateWillRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'A descriptive title for the will.', example: 'Last Will and Testament of John Mwangi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWillRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The initial status of the will.',
        enum: enums_1.WillStatus,
        default: enums_1.WillStatus.DRAFT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.WillStatus),
    __metadata("design:type", Object)
], CreateWillRequestDto.prototype, "status", void 0);
class UpdateAssetRequestDto {
    name;
    description;
}
exports.UpdateAssetRequestDto = UpdateAssetRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateAssetRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateAssetRequestDto.prototype, "description", void 0);
class UpdateWillRequestDto {
    title;
    status;
}
exports.UpdateWillRequestDto = UpdateWillRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'A new title for the will.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateWillRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The new status of the will.', enum: enums_1.WillStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.WillStatus),
    __metadata("design:type", String)
], UpdateWillRequestDto.prototype, "status", void 0);
class CreateAssetRequestDto {
    name;
    description;
    type = "LAND_PARCEL";
}
exports.CreateAssetRequestDto = CreateAssetRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The name of the asset.', example: 'Kajiado Land Parcel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateAssetRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'A detailed description of the asset.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateAssetRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.AssetType, description: 'The type of the asset.' }),
    (0, class_validator_1.IsEnum)(enums_1.AssetType),
    __metadata("design:type", String)
], CreateAssetRequestDto.prototype, "type", void 0);
class AssignBeneficiaryRequestDto {
    assetId;
    beneficiaryId;
    sharePercent;
}
exports.AssignBeneficiaryRequestDto = AssignBeneficiaryRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the asset to be assigned.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignBeneficiaryRequestDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the user who will be the beneficiary.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignBeneficiaryRequestDto.prototype, "beneficiaryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The percentage share of the asset to be assigned (1-100).',
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AssignBeneficiaryRequestDto.prototype, "sharePercent", void 0);
class CreateFamilyRequestDto {
    name;
}
exports.CreateFamilyRequestDto = CreateFamilyRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The name of the family group.', example: 'The Mwangi Family' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateFamilyRequestDto.prototype, "name", void 0);
class AddFamilyMemberRequestDto {
    userId;
    role = "OTHER";
}
exports.AddFamilyMemberRequestDto = AddFamilyMemberRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the user to add to the family.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddFamilyMemberRequestDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RelationshipType, description: 'The relationship of this user to the family creator.' }),
    (0, class_validator_1.IsEnum)(enums_1.RelationshipType),
    __metadata("design:type", String)
], AddFamilyMemberRequestDto.prototype, "role", void 0);
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================
class AssetResponseDto extends base_response_dto_1.BaseResponseDto {
    name;
    description;
    type = "LAND_PARCEL";
    ownerId;
}
exports.AssetResponseDto = AssetResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AssetResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], AssetResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.AssetType }),
    __metadata("design:type", String)
], AssetResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AssetResponseDto.prototype, "ownerId", void 0);
class BeneficiaryAssignmentResponseDto extends base_response_dto_1.BaseResponseDto {
    willId;
    assetId;
    beneficiaryId;
    sharePercent;
    asset;
    beneficiary = new user_dto_1.UserResponseDto;
}
exports.BeneficiaryAssignmentResponseDto = BeneficiaryAssignmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BeneficiaryAssignmentResponseDto.prototype, "willId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BeneficiaryAssignmentResponseDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BeneficiaryAssignmentResponseDto.prototype, "beneficiaryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BeneficiaryAssignmentResponseDto.prototype, "sharePercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => AssetResponseDto, description: 'Details of the assigned asset.' }),
    __metadata("design:type", AssetResponseDto)
], BeneficiaryAssignmentResponseDto.prototype, "asset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => user_dto_1.UserResponseDto, description: 'Details of the beneficiary.' }),
    __metadata("design:type", user_dto_1.UserResponseDto)
], BeneficiaryAssignmentResponseDto.prototype, "beneficiary", void 0);
class WillResponseDto extends base_response_dto_1.BaseResponseDto {
    title;
    status = "DRAFT";
    testatorId;
    beneficiaryAssignments;
}
exports.WillResponseDto = WillResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WillResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.WillStatus }),
    __metadata("design:type", String)
], WillResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WillResponseDto.prototype, "testatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [BeneficiaryAssignmentResponseDto],
        description: 'A list of all beneficiary assignments within this will.',
    }),
    __metadata("design:type", Array)
], WillResponseDto.prototype, "beneficiaryAssignments", void 0);
class FamilyMemberResponseDto {
    userId;
    role = "OTHER";
    user = new user_dto_1.UserResponseDto;
}
exports.FamilyMemberResponseDto = FamilyMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMemberResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RelationshipType }),
    __metadata("design:type", String)
], FamilyMemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => user_dto_1.UserResponseDto, description: 'Details of the family member.' }),
    __metadata("design:type", user_dto_1.UserResponseDto)
], FamilyMemberResponseDto.prototype, "user", void 0);
class FamilyResponseDto extends base_response_dto_1.BaseResponseDto {
    name;
    creatorId;
    members;
}
exports.FamilyResponseDto = FamilyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "creatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [FamilyMemberResponseDto],
        description: 'A list of all members in this family.',
    }),
    __metadata("design:type", Array)
], FamilyResponseDto.prototype, "members", void 0);
//# sourceMappingURL=succession.dto.js.map