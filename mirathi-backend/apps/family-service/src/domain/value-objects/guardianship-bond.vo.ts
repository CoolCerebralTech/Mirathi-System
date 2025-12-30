// src/domain/value-objects/guardianship-bond.vo.ts
import { ValueObject } from '../base/value-object';

export enum BondStatus {
  REQUIRED = 'REQUIRED',
  POSTED = 'POSTED',
  FORFEITED = 'FORFEITED',
  RELEASED = 'RELEASED',
  EXEMPT = 'EXEMPT',
}

export interface GuardianshipBondProps {
  status: BondStatus;
  amount?: number; // KES
  suretyCompany?: string;
  bondReference?: string;
  postedDate?: Date;
  releaseDate?: Date;
  courtOrderReference?: string;

  // 🎯 INNOVATIVE: Digital verification
  digitalVerificationUrl?: string;
  verifiedByCourtOfficer?: string;
}

export class GuardianshipBondVO extends ValueObject<GuardianshipBondProps> {
  constructor(props: GuardianshipBondProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.status === BondStatus.POSTED && !this.props.amount) {
      throw new Error('Bond amount required when status is POSTED');
    }

    if (this.props.status === BondStatus.POSTED && !this.props.postedDate) {
      throw new Error('Posted date required when bond is posted');
    }

    if (
      this.props.releaseDate &&
      this.props.postedDate &&
      this.props.releaseDate < this.props.postedDate
    ) {
      throw new Error('Release date cannot be before posted date');
    }
  }

  // 🎯 INNOVATIVE: Calculate bond expiration (typically 1 year)
  public getExpiryDate(): Date | null {
    if (!this.props.postedDate) return null;

    const expiry = new Date(this.props.postedDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }

  // 🎯 INNOVATIVE: Check if bond needs renewal
  public needsRenewal(): boolean {
    const expiry = this.getExpiryDate();
    if (!expiry) return false;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.props.status === BondStatus.POSTED && expiry <= thirtyDaysFromNow;
  }

  // 🎯 INNOVATIVE: Generate court-ready bond certificate
  public generateBondCertificate(): Record<string, any> {
    if (this.props.status !== BondStatus.POSTED) {
      throw new Error('Bond certificate only available for posted bonds');
    }

    return {
      bondReference: this.props.bondReference,
      amount: this.props.amount,
      suretyCompany: this.props.suretyCompany,
      postedDate: this.props.postedDate?.toISOString(),
      wardName: 'TO_BE_FILLED', // Would come from aggregate
      guardianName: 'TO_BE_FILLED',
      expiryDate: this.getExpiryDate()?.toISOString(),
      courtSeal: 'DIGITAL_SEAL_V1',
      qrCodeUrl: this.props.digitalVerificationUrl,
    };
  }

  public static create(props: GuardianshipBondProps): GuardianshipBondVO {
    return new GuardianshipBondVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.props,
      expiryDate: this.getExpiryDate()?.toISOString(),
      needsRenewal: this.needsRenewal(),
      certificate: this.props.status === BondStatus.POSTED ? this.generateBondCertificate() : null,
    };
  }
}
