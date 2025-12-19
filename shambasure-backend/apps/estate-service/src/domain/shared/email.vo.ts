// src/shared/domain/value-objects/email.vo.ts
import { ValueObject } from '../base/value-object';
import {
  EmailDomainBlacklistedException,
  InvalidEmailException,
  InvalidEmailFormatException,
  InvalidKenyanEmailException,
} from '../exceptions/email.exception';

export interface EmailProps {
  address: string;
  isVerified: boolean;
  verifiedAt?: Date;
  isPrimary: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private static readonly KENYAN_DOMAINS = [
    'co.ke',
    'ac.ke',
    'go.ke',
    'ne.ke',
    'or.ke',
    'sc.ke',
    'me.ke',
    'mobi.ke',
    'info.ke',
    'ke',
  ];
  private static readonly BLACKLISTED_DOMAINS = [
    'tempmail.com',
    'throwawaymail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
  ];

  constructor(props: EmailProps) {
    super(props);
  }

  protected validate(): void {
    this.validateFormat();
    this.validateDomain();
    this.validateBlacklistedDomain();
  }

  private validateFormat(): void {
    const email = this._value.address.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(email)) {
      throw new InvalidEmailFormatException(email, { email });
    }

    // Update with normalized email
    this._value.address = email;
  }

  private validateDomain(): void {
    const domain = this.extractDomain(this._value.address);

    // Check for basic domain validity
    if (domain.length < 3) {
      throw new InvalidEmailException(`Invalid email domain: ${domain}`, 'domain', {
        domain,
        email: this._value.address,
      });
    }

    // Check for Kenyan domain (optional validation)
    if (!this.isValidKenyanDomain(domain)) {
      // Not a Kenyan domain, but that's okay for international users
      console.warn(`Non-Kenyan email domain: ${domain}`);
    }
  }

  private validateBlacklistedDomain(): void {
    const domain = this.extractDomain(this._value.address);

    if (Email.BLACKLISTED_DOMAINS.includes(domain.toLowerCase())) {
      throw new EmailDomainBlacklistedException(domain, { domain, email: this._value.address });
    }
  }

  private extractDomain(email: string): string {
    return email.split('@')[1];
  }

  private isValidKenyanDomain(domain: string): boolean {
    return Email.KENYAN_DOMAINS.some((kenyanDomain) =>
      domain.toLowerCase().endsWith(kenyanDomain.toLowerCase()),
    );
  }

  // Factory methods
  static create(address: string, isVerified: boolean = false, isPrimary: boolean = false): Email {
    return new Email({
      address: address.trim().toLowerCase(),
      isVerified,
      isPrimary,
    });
  }

  static createKenyanEmail(
    address: string,
    isVerified: boolean = false,
    isPrimary: boolean = false,
  ): Email {
    const email = Email.create(address, isVerified, isPrimary);

    if (!email.isKenyanDomain()) {
      throw new InvalidKenyanEmailException(address, { email: address });
    }

    return email;
  }

  // Business logic methods
  verify(verifiedAt: Date = new Date()): Email {
    return new Email({
      ...this._value,
      isVerified: true,
      verifiedAt,
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
    });
  }

  markAsUnverified(): Email {
    return new Email({
      ...this._value,
      isVerified: false,
      verifiedAt: undefined,
    });
  }

  setAsPrimary(): Email {
    return new Email({
      ...this._value,
      isPrimary: true,
    });
  }

  setAsSecondary(): Email {
    return new Email({
      ...this._value,
      isPrimary: false,
    });
  }

  generateVerificationToken(expiresInHours: number = 24): Email {
    const token = this.generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return new Email({
      ...this._value,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    });
  }

  validateVerificationToken(token: string): boolean {
    if (!this._value.verificationToken || !this._value.verificationTokenExpiresAt) {
      return false;
    }

    const isTokenValid = this._value.verificationToken === token;
    const isTokenNotExpired = this._value.verificationTokenExpiresAt > new Date();

    return isTokenValid && isTokenNotExpired;
  }

  isKenyanDomain(): boolean {
    const domain = this.extractDomain(this._value.address);
    return this.isValidKenyanDomain(domain);
  }

  isCorporateEmail(): boolean {
    const domain = this.extractDomain(this._value.address);
    const corporateIndicators = [
      'company',
      'corp',
      'inc',
      'ltd',
      'limited',
      'enterprise',
      'business',
      'org',
      'co.',
    ];

    return corporateIndicators.some((indicator) => domain.toLowerCase().includes(indicator));
  }

  isEducationalEmail(): boolean {
    const domain = this.extractDomain(this._value.address);
    const educationalIndicators = ['ac.', 'edu', 'school', 'college', 'university', 'institute'];

    return educationalIndicators.some((indicator) => domain.toLowerCase().includes(indicator));
  }

  // Formatting methods
  getMaskedEmail(): string {
    const [localPart, domain] = this._value.address.split('@');

    if (localPart.length <= 2) {
      return '***@' + domain;
    }

    const maskedLocal = localPart.charAt(0) + '***' + localPart.charAt(localPart.length - 1);
    return maskedLocal + '@' + domain;
  }

  getDomain(): string {
    return this.extractDomain(this._value.address);
  }

  getLocalPart(): string {
    return this._value.address.split('@')[0];
  }

  // For legal documents
  getFormattedForDocument(): string {
    return `Email: ${this._value.address}`;
  }

  // Helper methods
  private generateRandomToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  // Getters
  get address(): string {
    return this._value.address;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this._value.verifiedAt;
  }

  get isPrimary(): boolean {
    return this._value.isPrimary;
  }

  get verificationToken(): string | undefined {
    return this._value.verificationToken;
  }

  get verificationTokenExpiresAt(): Date | undefined {
    return this._value.verificationTokenExpiresAt;
  }
}
