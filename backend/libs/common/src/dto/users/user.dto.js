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
exports.UserResponseDto = exports.UserQueryDto = exports.UpdateUserProfileRequestDto = exports.UpdateUserRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../enums");
const base_response_dto_1 = require("../shared/base.response.dto");
const class_transformer_1 = require("class-transformer");
const pagination_dto_1 = require("../shared/pagination.dto");
// ============================================================================
// ARCHITECTURAL NOTE:
// `CreateUserDto` has been removed. User creation is handled exclusively
// through the public registration flow (`RegisterRequestDto` in auth.dto.ts)
// or potentially a future, separate admin flow. This prevents ambiguity.
// ============================================================================
// ============================================================================
// NESTED DTOs (For Input Validation)
// ============================================================================
class AddressDto {
    street;
    city;
    postCode;
    country;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Shamba Lane' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nairobi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00100' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "postCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Kenya' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "country", void 0);
class NextOfKinDto {
    fullName;
    relationship;
    phoneNumber;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jane Mwangi' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NextOfKinDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Spouse' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NextOfKinDto.prototype, "relationship", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsPhoneNumber)('KE') // Example: Region-specific phone number validation
    ,
    __metadata("design:type", String)
], NextOfKinDto.prototype, "phoneNumber", void 0);
// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================
class UpdateUserRequestDto {
    firstName;
    lastName;
    // Note: Email changes should typically have a separate, more secure flow
    // (e.g., with verification), but is included here for basic profile updates.
    email;
}
exports.UpdateUserRequestDto = UpdateUserRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateUserRequestDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateUserRequestDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateUserRequestDto.prototype, "email", void 0);
class UpdateUserProfileRequestDto {
    bio;
    phoneNumber;
    address;
    nextOfKin;
}
exports.UpdateUserProfileRequestDto = UpdateUserProfileRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'A short user biography.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateUserProfileRequestDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User\'s primary phone number.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('KE'),
    __metadata("design:type", String)
], UpdateUserProfileRequestDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: AddressDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    __metadata("design:type", AddressDto)
], UpdateUserProfileRequestDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: NextOfKinDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NextOfKinDto),
    __metadata("design:type", NextOfKinDto)
], UpdateUserProfileRequestDto.prototype, "nextOfKin", void 0);
/**
 * Defines the query parameters for filtering a list of users.
 * Extends the base PaginationQueryDto.
 */
class UserQueryDto extends pagination_dto_1.PaginationQueryDto {
    role;
}
exports.UserQueryDto = UserQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter users by their role.',
        enum: enums_1.UserRole,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.UserRole),
    __metadata("design:type", String)
], UserQueryDto.prototype, "role", void 0);
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================
class UserProfileResponseDto {
    bio;
    phoneNumber;
    address; // In responses, we can be less strict with the shape if needed
    nextOfKin;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'object' }),
    __metadata("design:type", Object)
], UserProfileResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'object' }),
    __metadata("design:type", Object)
], UserProfileResponseDto.prototype, "nextOfKin", void 0);
class UserResponseDto extends base_response_dto_1.BaseResponseDto {
    email;
    firstName;
    lastName;
    role = "LAND_OWNER";
    profile;
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.UserRole }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => UserProfileResponseDto }),
    __metadata("design:type", UserProfileResponseDto)
], UserResponseDto.prototype, "profile", void 0);
//# sourceMappingURL=user.dto.js.map