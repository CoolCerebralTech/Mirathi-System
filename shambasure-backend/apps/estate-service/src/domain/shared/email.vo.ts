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
  subscribedToNotifications: boolean;
  subscribedToLegalUpdates: boolean;
  subscribedToMarketing: boolean;
  lastVerifiedIp?: string;
  verificationMethod?: 'OTP' | 'LINK' | 'MANUAL' | 'COURT_ORDER';
}

export class Email extends ValueObject<EmailProps> {
  // Comprehensive email regex (RFC 5322 compliant)
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Kenyan domains (government, commercial, educational)
  private static readonly KENYAN_DOMAINS = [
    // Government & Public Sector
    'go.ke',
    'ac.ke',
    'co.ke',
    'or.ke',
    'ne.ke',
    'sc.ke',
    'me.ke',
    // Educational
    'uonbi.ac.ke',
    'ku.ac.ke',
    'mku.ac.ke',
    'jkuat.ac.ke',
    'kemu.ac.ke',
    'kca.ac.ke',
    'strathmore.edu',
    'usiu.ac.ke',
    'daystar.ac.ke',
    // Major Corporations
    'safaricom.co.ke',
    'airtel.co.ke',
    'telkom.co.ke',
    'kcbgroup.com',
    'equitybank.co.ke',
    'cooperativebank.co.ke',
    'ncba.co.ke',
    'kra.go.ke',
    'nssf.or.ke',
    'nhif.or.ke',
    'kengen.co.ke',
    // Media
    'nation.co.ke',
    'standardmedia.co.ke',
    'citizen.tv',
    'kbc.co.ke',
    // General Kenyan domains
    'ke',
    'co.ke',
    'org.ke',
    'net.ke',
    'info.ke',
    'biz.ke',
    'mobi.ke',
  ];

  // Blacklisted/temporary email domains for legal compliance
  private static readonly BLACKLISTED_DOMAINS = [
    // Temporary email services
    'tempmail.com',
    'throwawaymail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
    'dispostable.com',
    'fakeinbox.com',
    'maildrop.cc',
    'getairmail.com',
    'tempmail.net',
    // Known spam domains
    'spam4.me',
    'spamgourmet.com',
    'spamherelots.com',
    // Legal restrictions
    'anonymous.com',
    'anonemail.com',
    'hidemyass.com',
  ];

  // Domains requiring additional verification for legal purposes
  private static readonly HIGH_RISK_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'ymail.com',
    'aol.com',
    'protonmail.com',
    'tutanota.com',
  ];

  constructor(props: EmailProps) {
    super(props);
  }

  protected validate(): void {
    this.validateFormat();
    this.validateLength();
    this.validateDomain();
    this.validateBlacklistedDomain();
  }

  private validateFormat(): void {
    const email = this._value.address.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(email)) {
      throw new InvalidEmailFormatException(email, { email });
    }

    // Additional format checks
    if (email.indexOf('..') !== -1) {
      throw new InvalidEmailException('Email contains consecutive dots', 'format', { email });
    }

    if (email.startsWith('.') || email.endsWith('.')) {
      throw new InvalidEmailException('Email cannot start or end with a dot', 'format', { email });
    }

    // Update with normalized email
    this._value.address = email;
  }

  private validateLength(): void {
    const email = this._value.address;

    // RFC 5322 limits
    if (email.length > 254) {
      throw new InvalidEmailException('Email address too long (max 254 characters)', 'length', {
        email,
        length: email.length,
      });
    }

    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      throw new InvalidEmailException('Local part too long (max 64 characters)', 'length', {
        email,
        localPartLength: localPart.length,
      });
    }
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

    // Check for Kenyan domain (optional but recommended for legal compliance)
    if (!this.isValidKenyanDomain(domain)) {
      // Log warning for non-Kenyan domains in legal context
      console.warn(`Non-Kenyan email domain detected for legal entity: ${domain}`);
    }
  }

  private validateBlacklistedDomain(): void {
    const domain = this.extractDomain(this._value.address);

    if (Email.BLACKLISTED_DOMAINS.includes(domain.toLowerCase())) {
      throw new EmailDomainBlacklistedException(domain, {
        domain,
        email: this._value.address,
        reason: 'Temporary/disposable email domain not accepted for legal purposes',
      });
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
      subscribedToNotifications: true,
      subscribedToLegalUpdates: true,
      subscribedToMarketing: false,
    });
  }

  static createKenyanLegalEmail(
    address: string,
    isVerified: boolean = false,
    isPrimary: boolean = false,
  ): Email {
    const email = Email.create(address, isVerified, isPrimary);

    if (!email.isKenyanDomain()) {
      throw new InvalidKenyanEmailException(address, {
        email: address,
        reason: 'Legal communications require Kenyan domain for compliance',
      });
    }

    // Kenyan legal emails require legal updates subscription
    return email.withLegalUpdates(true);
  }

  // Business logic methods
  verify(
    verifiedAt: Date = new Date(),
    verificationMethod: 'OTP' | 'LINK' | 'MANUAL' | 'COURT_ORDER' = 'OTP',
    verifiedIp?: string,
  ): Email {
    return new Email({
      ...this._value,
      isVerified: true,
      verifiedAt,
      verificationMethod,
      lastVerifiedIp: verifiedIp,
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
    });
  }

  markAsUnverified(): Email {
    return new Email({
      ...this._value,
      isVerified: false,
      verifiedAt: undefined,
      verificationMethod: undefined,
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
    const token = this.generateSecureToken();
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

  withNotifications(enabled: boolean): Email {
    return new Email({
      ...this._value,
      subscribedToNotifications: enabled,
    });
  }

  withLegalUpdates(enabled: boolean): Email {
    return new Email({
      ...this._value,
      subscribedToLegalUpdates: enabled,
    });
  }

  withMarketing(enabled: boolean): Email {
    return new Email({
      ...this._value,
      subscribedToMarketing: enabled,
    });
  }

  // Domain classification
  isKenyanDomain(): boolean {
    const domain = this.extractDomain(this._value.address);
    return this.isValidKenyanDomain(domain);
  }

  isGovernmentDomain(): boolean {
    const domain = this.extractDomain(this._value.address);
    return domain.endsWith('.go.ke') || domain.endsWith('.ac.ke');
  }

  isCorporateDomain(): boolean {
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
      'group',
      'holdings',
      'capital',
    ];
    return corporateIndicators.some((indicator) => domain.toLowerCase().includes(indicator));
  }

  isEducationalDomain(): boolean {
    const domain = this.extractDomain(this._value.address);
    const educationalIndicators = [
      'ac.',
      'edu',
      'school',
      'college',
      'university',
      'institute',
      'polytechnic',
      'campus',
      'learn',
      'education',
    ];
    return educationalIndicators.some((indicator) => domain.toLowerCase().includes(indicator));
  }

  isHighRiskDomain(): boolean {
    const domain = this.extractDomain(this._value.address);
    return Email.HIGH_RISK_DOMAINS.includes(domain.toLowerCase());
  }

  requiresEnhancedVerification(): boolean {
    // For legal purposes, high-risk domains require additional verification
    return this.isHighRiskDomain() || !this.isKenyanDomain();
  }

  // For succession/legal notifications
  canReceiveLegalNotifications(): boolean {
    return this._value.isVerified && this._value.subscribedToLegalUpdates;
  }

  canReceiveCourtNotices(): boolean {
    // Court notices require verified email, preferably Kenyan domain
    return this._value.isVerified && (this.isKenyanDomain() || this.isGovernmentDomain());
  }

  // Formatting methods
  getMaskedEmail(): string {
    const [localPart, domain] = this._value.address.split('@');

    if (localPart.length <= 2) {
      return '***@' + domain;
    }

    // Show first character, then ***, then last character before @
    const maskedLocal =
      localPart.charAt(0) +
      '***' +
      (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '');
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
    return `Email Address: ${this._value.address}`;
  }

  getFormattedForCourtFiling(): string {
    return `Electronic Service Address: ${this._value.address}`;
  }

  // Helper methods
  private generateSecureToken(): string {
    // Generate cryptographically secure token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
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

  get subscribedToNotifications(): boolean {
    return this._value.subscribedToNotifications;
  }

  get subscribedToLegalUpdates(): boolean {
    return this._value.subscribedToLegalUpdates;
  }

  get subscribedToMarketing(): boolean {
    return this._value.subscribedToMarketing;
  }

  get verificationMethod(): string | undefined {
    return this._value.verificationMethod;
  }

  // For API responses
  toJSON() {
    return {
      address: this.getMaskedEmail(),
      isVerified: this._value.isVerified,
      verifiedAt: this._value.verifiedAt,
      isPrimary: this._value.isPrimary,
      domainType: this.getDomainType(),
      canReceiveLegalNotifications: this.canReceiveLegalNotifications(),
      canReceiveCourtNotices: this.canReceiveCourtNotices(),
      requiresEnhancedVerification: this.requiresEnhancedVerification(),
      subscriptions: {
        notifications: this._value.subscribedToNotifications,
        legalUpdates: this._value.subscribedToLegalUpdates,
        marketing: this._value.subscribedToMarketing,
      },
    };
  }

  private getDomainType(): string {
    if (this.isGovernmentDomain()) return 'GOVERNMENT';
    if (this.isEducationalDomain()) return 'EDUCATIONAL';
    if (this.isCorporateDomain()) return 'CORPORATE';
    if (this.isKenyanDomain()) return 'KENYAN';
    if (this.isHighRiskDomain()) return 'HIGH_RISK';
    return 'INTERNATIONAL';
  }
}
