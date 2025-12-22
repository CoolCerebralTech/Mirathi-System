import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';

export class InvalidRevocationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_REVOCATION');
  }
}

export enum RevocationMethod {
  NEW_WILL = 'NEW_WILL', // S.19
  CODICIL = 'CODICIL', // S.16
  DESTRUCTION = 'DESTRUCTION', // S.18
  MARRIAGE = 'MARRIAGE', // S.17
  COURT_ORDER = 'COURT_ORDER',
  DIVORCE = 'DIVORCE',
}

interface RevocationDetailsProps {
  method: RevocationMethod;
  revokedAt: Date;
  revokedBy: string; // User ID

  // Context
  reason?: string;
  referenceId?: string; // New Will ID, Codicil ID, Marriage Cert No.

  // S.18 Destruction Specifics
  witnesses?: string[]; // IDs
}

export class RevocationDetails extends ValueObject<RevocationDetailsProps> {
  private constructor(props: RevocationDetailsProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.revokedAt > new Date()) {
      throw new InvalidRevocationException('Revocation date cannot be in the future');
    }

    if (this.props.method === RevocationMethod.DESTRUCTION) {
      if (!this.props.witnesses || this.props.witnesses.length < 2) {
        throw new InvalidRevocationException(
          'Destruction requires at least 2 witnesses (S.18 LSA)',
        );
      }
    }

    if (this.props.method === RevocationMethod.NEW_WILL && !this.props.referenceId) {
      throw new InvalidRevocationException('Revocation by New Will requires Reference ID');
    }
  }

  static create(props: {
    method: RevocationMethod;
    revokedBy: string;
    referenceId?: string;
    witnesses?: string[];
    reason?: string;
  }): RevocationDetails {
    return new RevocationDetails({
      method: props.method,
      revokedAt: new Date(),
      revokedBy: props.revokedBy,
      referenceId: props.referenceId,
      witnesses: props.witnesses,
      reason: props.reason,
    });
  }

  // --- Business Logic ---

  getLegalBasis(): string {
    switch (this.props.method) {
      case RevocationMethod.NEW_WILL:
        return 'S.19 LSA';
      case RevocationMethod.CODICIL:
        return 'S.16 LSA';
      case RevocationMethod.MARRIAGE:
        return 'S.17 LSA';
      case RevocationMethod.DESTRUCTION:
        return 'S.18 LSA';
      default:
        return 'Court Order / Common Law';
    }
  }

  // --- Getters ---
  get method(): RevocationMethod {
    return this.props.method;
  }
  get date(): Date {
    return this.props.revokedAt;
  }

  public toJSON(): Record<string, any> {
    return {
      method: this.props.method,
      date: this.props.revokedAt,
      legalBasis: this.getLegalBasis(),
      reference: this.props.referenceId,
      reason: this.props.reason,
    };
  }
}
