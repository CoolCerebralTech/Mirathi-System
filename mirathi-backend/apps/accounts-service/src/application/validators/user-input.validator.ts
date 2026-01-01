// src/application/validators/user-input.validator.ts
import { Injectable } from '@nestjs/common';
import { AuthProvider, Language, Theme, UserRole } from '@prisma/client';

import { InvalidInputException } from '../exceptions/user.exception';

@Injectable()
export class UserInputValidator {
  /**
   * Validate email format
   */
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidInputException('email', 'Invalid email format');
    }
  }

  /**
   * Validate name (first/last name)
   */
  validateName(name: string, fieldName: string): void {
    if (!name || name.trim().length < 1) {
      throw new InvalidInputException(fieldName, 'Name cannot be empty');
    }

    if (name.length > 100) {
      throw new InvalidInputException(fieldName, 'Name too long (max 100 characters)');
    }

    // No special characters except hyphens, apostrophes, and spaces
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
      throw new InvalidInputException(fieldName, 'Name contains invalid characters');
    }
  }

  /**
   * Validate OAuth provider
   */
  validateProvider(provider: string): void {
    const validProviders = Object.values(AuthProvider);
    if (!validProviders.includes(provider as AuthProvider)) {
      throw new InvalidInputException(
        'provider',
        `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
      );
    }
  }

  /**
   * Validate user role
   */
  validateRole(role: string): void {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      throw new InvalidInputException(
        'role',
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }
  }

  /**
   * Validate language
   */
  validateLanguage(language: string): void {
    const validLanguages = Object.values(Language);
    if (!validLanguages.includes(language as Language)) {
      throw new InvalidInputException(
        'language',
        `Invalid language. Must be one of: ${validLanguages.join(', ')}`,
      );
    }
  }

  /**
   * Validate theme
   */
  validateTheme(theme: string): void {
    const validThemes = Object.values(Theme);
    if (!validThemes.includes(theme as Theme)) {
      throw new InvalidInputException(
        'theme',
        `Invalid theme. Must be one of: ${validThemes.join(', ')}`,
      );
    }
  }

  /**
   * Validate avatar URL
   */
  validateAvatarUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new InvalidInputException('avatarUrl', 'Invalid URL format');
    }

    // Must be HTTPS
    if (!url.startsWith('https://')) {
      throw new InvalidInputException('avatarUrl', 'Avatar URL must use HTTPS');
    }
  }

  /**
   * Validate address (physical/postal)
   */
  validateAddress(address: string, fieldName: string): void {
    if (address.length > 500) {
      throw new InvalidInputException(fieldName, 'Address too long (max 500 characters)');
    }
  }
}
