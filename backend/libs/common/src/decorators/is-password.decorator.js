"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsStrongPassword = IsStrongPassword;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
/**
 * A custom composite decorator for validating a strong password.
 * It combines multiple `class-validator` decorators into one.
 * The policy is: 8-100 characters, at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 */
function IsStrongPassword() {
    return (0, common_1.applyDecorators)((0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }), (0, class_validator_1.MaxLength)(100, { message: 'Password cannot be longer than 100 characters' }), (0, class_validator_1.Matches)(/(?=.*[a-z])/, { message: 'Password must contain a lowercase letter' }), (0, class_validator_1.Matches)(/(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter' }), (0, class_validator_1.Matches)(/(?=.*\d)/, { message: 'Password must contain a number' }), (0, class_validator_1.Matches)(/(?=.*[@$!%*?&])/, { message: 'Password must contain a special character' }));
}
//# sourceMappingURL=is-password.decorator.js.map