import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

/**
 * A custom composite decorator for validating a strong password.
 * It combines multiple `class-validator` decorators into one.
 * The policy is: 8-100 characters, at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 */
export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    MaxLength(100, { message: 'Password cannot be longer than 100 characters' }),
    Matches(/(?=.*[a-z])/, { message: 'Password must contain a lowercase letter' }),
    Matches(/(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter' }),
    Matches(/(?=.*\d)/, { message: 'Password must contain a number' }),
    Matches(/(?=.*[@$!%*?&])/, { message: 'Password must contain a special character' }),
  );
}