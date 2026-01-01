// src/domain/services/phone-verification.domain-service.ts
import { User } from '../aggregates/user.aggregate';

/**
 * Domain Service for phone verification business logic
 *
 * This service contains logic that doesn't naturally fit in the User aggregate
 * but is still part of the domain (business rules about phone verification)
 */
export class PhoneVerificationDomainService {
  /**
   * Check if a user can request phone verification
   */
  static canRequestVerification(user: User): { canRequest: boolean; reason?: string } {
    if (user.isDeleted) {
      return { canRequest: false, reason: 'User is deleted' };
    }

    if (user.isSuspended) {
      return { canRequest: false, reason: 'User is suspended' };
    }

    const profile = user.profile;
    if (!profile) {
      return { canRequest: false, reason: 'Profile is required' };
    }

    if (!profile.phoneNumber) {
      return { canRequest: false, reason: 'Phone number is required' };
    }

    if (profile.phoneVerified) {
      return { canRequest: false, reason: 'Phone is already verified' };
    }

    if (profile.isVerificationAttemptsExhausted) {
      return { canRequest: false, reason: 'Maximum verification attempts exceeded' };
    }

    if (profile.isVerificationInProgress) {
      const remaining = profile.verificationTimeRemaining;
      return {
        canRequest: false,
        reason: `Please wait ${remaining} minutes before requesting another code`,
      };
    }

    return { canRequest: true };
  }

  /**
   * Validate phone verification attempt
   */
  static validateVerificationAttempt(
    user: User,
    otpCode: string,
  ): { isValid: boolean; error?: string } {
    const profile = user.profile;
    if (!profile) {
      return { isValid: false, error: 'Profile is required' };
    }

    if (!profile.phoneNumber) {
      return { isValid: false, error: 'Phone number is required' };
    }

    if (profile.phoneVerified) {
      return { isValid: false, error: 'Phone is already verified' };
    }

    if (!profile.isVerificationInProgress) {
      return { isValid: false, error: 'No verification in progress' };
    }

    if (profile.verificationTimeRemaining <= 0) {
      return { isValid: false, error: 'Verification code has expired' };
    }

    // Basic OTP format validation (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return { isValid: false, error: 'Invalid OTP format' };
    }

    return { isValid: true };
  }

  /**
   * Generate a secure OTP (for testing/mocking)
   * In production, this would be handled by the infrastructure layer
   */
  static generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return otp;
  }

  /**
   * Calculate OTP expiry time (default 5 minutes)
   */
  static calculateExpiryTime(minutes: number = 5): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
  }
}
