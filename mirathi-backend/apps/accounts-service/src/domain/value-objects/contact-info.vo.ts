// src/domain/value-objects/contact-info.vo.ts
import { ValueObject } from './base.vo';
import { PhoneNumber } from './phone-number.vo';

/**
 * Contact Information Value Object
 *
 * Business Rules:
 * 1. At least one contact method must be provided
 * 2. Email must be valid if provided
 * 3. Phone number must be valid if provided
 */
export interface ContactInfoProps {
  email?: string;
  phone?: PhoneNumber;
  preferredMethod?: 'email' | 'sms';
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  protected validate(): void {
    const { email, phone } = this._value;

    // Must have at least one contact method
    if (!email && !phone) {
      throw new Error('At least one contact method (email or phone) is required');
    }

    // Validate email if provided
    if (email && !this.isValidEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }

    // Preferred method must be valid if provided
    if (this._value.preferredMethod && !['email', 'sms'].includes(this._value.preferredMethod)) {
      throw new Error('Preferred method must be either "email" or "sms"');
    }

    // If preferred method is SMS, phone must be provided
    if (this._value.preferredMethod === 'sms' && !phone) {
      throw new Error('Phone number is required when preferred method is SMS');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get email(): string | undefined {
    return this._value.email;
  }

  get phone(): PhoneNumber | undefined {
    return this._value.phone;
  }

  get preferredMethod(): 'email' | 'sms' | undefined {
    return this._value.preferredMethod;
  }

  /**
   * Get the best contact method (prioritizes preferred method)
   */
  get bestContactMethod(): 'email' | 'sms' | null {
    if (this._value.preferredMethod) {
      return this._value.preferredMethod;
    }
    if (this._value.email) {
      return 'email';
    }
    if (this._value.phone) {
      return 'sms';
    }
    return null;
  }

  /**
   * Check if email notifications are possible
   */
  get canReceiveEmail(): boolean {
    return !!this._value.email;
  }

  /**
   * Check if SMS notifications are possible
   */
  get canReceiveSms(): boolean {
    return !!this._value.phone;
  }

  /**
   * Update email address
   */
  withEmail(email: string): ContactInfo {
    return new ContactInfo({
      ...this._value,
      email,
    });
  }

  /**
   * Update phone number
   */
  withPhone(phone: PhoneNumber): ContactInfo {
    return new ContactInfo({
      ...this._value,
      phone,
    });
  }

  /**
   * Update preferred method
   */
  withPreferredMethod(method: 'email' | 'sms'): ContactInfo {
    return new ContactInfo({
      ...this._value,
      preferredMethod: method,
    });
  }

  /**
   * Check if contact info is complete (has both email and phone)
   */
  get isComplete(): boolean {
    return !!this._value.email && !!this._value.phone;
  }

  /**
   * Get string representation for display
   */
  toString(): string {
    // FIX: Explicitly define the array type as string[]
    const parts: string[] = [];

    if (this._value.email) parts.push(`Email: ${this._value.email}`);
    if (this._value.phone) parts.push(`Phone: ${this._value.phone.value}`);
    if (this._value.preferredMethod)
      parts.push(`Prefers: ${this._value.preferredMethod.toUpperCase()}`);

    return parts.join(' | ');
  }
}
