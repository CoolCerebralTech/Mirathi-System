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
exports.AuthResponseDto = exports.ForgotPasswordRequestDto = exports.ResetPasswordRequestDto = exports.ChangePasswordRequestDto = exports.RegisterRequestDto = exports.LoginRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../enums");
const base_response_dto_1 = require("../shared/base.response.dto");
const is_password_decorator_1 = require("../../decorators/is-password.decorator");
// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================
class LoginRequestDto {
    email;
    password;
}
exports.LoginRequestDto = LoginRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User email address.', example: 'john.mwangi@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User password.', example: 'SecurePassword123!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "password", void 0);
class RegisterRequestDto {
    firstName;
    lastName;
    email;
    password;
    role = enums_1.UserRole.LAND_OWNER;
}
exports.RegisterRequestDto = RegisterRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User first name.', example: 'John' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User last name.', example: 'Mwangi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User email address.', example: 'john.mwangi@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User password. Must meet the configured security policy.',
        example: 'SecurePassword123!',
    }),
    (0, is_password_decorator_1.IsStrongPassword)(),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User role. Defaults to LAND_OWNER.',
        enum: enums_1.UserRole,
        default: enums_1.UserRole.LAND_OWNER,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.UserRole),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "role", void 0);
class ChangePasswordRequestDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordRequestDto = ChangePasswordRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The user\'s current password.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangePasswordRequestDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The desired new password.' }),
    (0, is_password_decorator_1.IsStrongPassword)(),
    __metadata("design:type", String)
], ChangePasswordRequestDto.prototype, "newPassword", void 0);
class ResetPasswordRequestDto {
    token;
    newPassword;
}
exports.ResetPasswordRequestDto = ResetPasswordRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The password reset token received via email/SMS.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordRequestDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The desired new password.' }),
    (0, is_password_decorator_1.IsStrongPassword)(),
    __metadata("design:type", String)
], ResetPasswordRequestDto.prototype, "newPassword", void 0);
class ForgotPasswordRequestDto {
    email;
}
exports.ForgotPasswordRequestDto = ForgotPasswordRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The email address to send a password reset link to.' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordRequestDto.prototype, "email", void 0);
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================
/**
 * Defines the shape of the User object returned upon successful authentication.
 */
class AuthUserResponseDto extends base_response_dto_1.BaseResponseDto {
    email;
    firstName;
    lastName;
    role = "LAND_OWNER";
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john.mwangi@example.com' }),
    __metadata("design:type", String)
], AuthUserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], AuthUserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mwangi' }),
    __metadata("design:type", String)
], AuthUserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.UserRole, example: enums_1.UserRole.LAND_OWNER }),
    __metadata("design:type", String)
], AuthUserResponseDto.prototype, "role", void 0);
/**
 * Defines the response body for a successful login or registration.
 */
class AuthResponseDto {
    accessToken;
    refreshToken;
    user = new AuthUserResponseDto;
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'A short-lived JSON Web Token for API access.' }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'A long-lived token used to obtain a new access token.' }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => AuthUserResponseDto }) // Add Swagger decorator
    ,
    __metadata("design:type", AuthUserResponseDto)
], AuthResponseDto.prototype, "user", void 0);
//# sourceMappingURL=auth.dto.js.map