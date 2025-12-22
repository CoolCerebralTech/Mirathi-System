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
  isKenyanLegalCompliant: boolean; // Flag if we enforced strict Kenyan domain checks
}

export class Email extends ValueObject<EmailProps> {
  // RFC 5322 compliant regex
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Kenyan domains
  private static readonly KENYAN_DOMAINS = [
    'go.ke',
    'ac.ke',
    'co.ke',
    'or.ke',
    'ne.ke',
    'sc.ke',
    'me.ke',
    'uonbi.ac.ke',
    'ku.ac.ke',
    'strathmore.edu',
    'usiu.ac.ke',
    'safaricom.co.ke',
    'kra.go.ke',
    'judiciary.go.ke',
  ];

  private static readonly BLACKLISTED_DOMAINS = [
    'tempmail.com',
    'throwawaymail.com',
    'mailinator.com',
    '10minutemail.com',
    'yopmail.com',
    'guerrillamail.com',
    'trashmail.com',
  ];

  constructor(props: EmailProps) {
    super(props);
  }

  protected validate(): void {
    this.validateFormat();
    this.validateLength();
    this.validateBlacklistedDomain();

    if (this.props.isKenyanLegalCompliant) {
      this.validateKenyanDomain();
    }
  }

  private validateFormat(): void {
    const email = this.props.address.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(email)) {
      throw new InvalidEmailFormatException(email);
    }
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      throw new InvalidEmailException('Invalid dot usage in email', 'format');
    }
  }

  private validateLength(): void {
    if (this.props.address.length > 254) {
      throw new InvalidEmailException('Email too long', 'length', {
        length: this.props.address.length,
      });
    }
  }

  private validateBlacklistedDomain(): void {
    const domain = this.getDomain();
    if (Email.BLACKLISTED_DOMAINS.includes(domain)) {
      throw new EmailDomainBlacklistedException(domain);
    }
  }

  private validateKenyanDomain(): void {
    if (!this.isKenyanDomain()) {
      throw new InvalidKenyanEmailException(this.props.address, {
        reason: 'Legal compliance requires a Kenyan (.ke) domain',
      });
    }
  }

  // --- Factory Methods ---

  static create(address: string, isVerified: boolean = false, isPrimary: boolean = false): Email {
    return new Email({
      address: address.trim().toLowerCase(),
      isVerified,
      isPrimary,
      isKenyanLegalCompliant: false,
    });
  }

  static createKenyanLegalEmail(address: string, isVerified: boolean = false): Email {
    return new Email({
      address: address.trim().toLowerCase(),
      isVerified,
      isPrimary: true, // Legal emails are usually primary
      isKenyanLegalCompliant: true, // Enforces strict checks in validate()
    });
  }

  // --- Business Logic ---

  getDomain(): string {
    return this.props.address.split('@')[1];
  }

  isKenyanDomain(): boolean {
    const domain = this.getDomain();
    return domain.endsWith('.ke') || Email.KENYAN_DOMAINS.some((d) => domain.endsWith(d));
  }

  isGovernmentDomain(): boolean {
    return this.getDomain().endsWith('.go.ke');
  }

  isEducationalDomain(): boolean {
    return this.getDomain().endsWith('.ac.ke') || this.getDomain().endsWith('.edu');
  }

  canReceiveCourtNotices(): boolean {
    // Kenyan court system prefers verified emails, ideally local
    return this.props.isVerified;
  }

  // Masking for logs/audit
  getMaskedEmail(): string {
    const [localPart, domain] = this.props.address.split('@');
    if (localPart.length <= 2) return `***@${domain}`;

    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }

  // Getters
  get address(): string {
    return this.props.address;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  public toJSON(): Record<string, any> {
    return {
      address: this.getMaskedEmail(), // Always mask in generic JSON output
      isVerified: this.props.isVerified,
      isPrimary: this.props.isPrimary,
      isKenyanDomain: this.isKenyanDomain(),
      isGovernmentDomain: this.isGovernmentDomain(),
    };
  }
}
