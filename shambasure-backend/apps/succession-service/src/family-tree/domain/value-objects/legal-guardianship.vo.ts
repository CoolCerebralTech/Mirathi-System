import { ValueObject } from '@shared/core/domain/value-object';
import { GuardianType } from '@prisma/client';
import { KenyanGuardianshipValidationError } from '@shared/errors/kenyan-law.errors';

export interface LegalGuardianshipProps {
  type: GuardianType;
  appointedBy: string; // Will ID or court order reference
  appointmentDate: Date;
  validUntil?: Date;
  isActive: boolean;
}

export class LegalGuardianship extends ValueObject<LegalGuardianshipProps> {
  private constructor(props: LegalGuardianshipProps) {
    super(props);
    this.validate();
  }

  public static create(
    type: GuardianType,
    appointedBy: string,
    appointmentDate: Date = new Date(),
    validUntil?: Date,
    isActive: boolean = true
  ): LegalGuardianship {
    return new LegalGuardianship({
      type,
      appointedBy,
      appointmentDate,
      validUntil,
      isActive
    });
  }

  private validate(): void {
    if (this.props.appointmentDate > new Date()) {
      throw new KenyanGuardianshipValidationError('Appointment date cannot be in the future');
    }

    if (this.props.validUntil && this.props.validUntil <= this.props.appointmentDate) {
      throw new KenyanGuardianshipValidationError('Valid until date must be after appointment date');
    }

    if (this.props.type === GuardianType.TESTAMENTARY && !this.props.appointedBy.startsWith('WILL_')) {
      throw new KenyanGuardianshipValidationError('Testamentary guardians must be appointed by a will');
    }
  }

  public get type(): GuardianType {
    return this.props.type;
  }

  public get appointedBy(): string {
    return this.props.appointedBy;
  }

  public get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  public get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public isExpired(): boolean {
    if (!this.props.validUntil) return false;
    return new Date() > this.props.validUntil;
  }

  public isTestamentary(): boolean {
    return this.props.type === GuardianType.TESTAMENTARY;
  }

  public isLegalGuardian(): boolean {
    return this.props.type === GuardianType.LEGAL_GUARDIAN;
  }

  public deactivate(): LegalGuardianship {
    return new LegalGuardianship({
      ...this.props,
      isActive: false
    });
  }

  public extendValidity(newValidUntil: Date): LegalGuardianship {
    if (newValidUntil <= this.props.appointmentDate) {
      throw new KenyanGuardianshipValidationError('New validity date must be after appointment date');
    }

    return new LegalGuardianship({
      ...this.props,
      validUntil: newValidUntil
    });
  }

  public equals(vo?: LegalGuardianship): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    return (
      this.props.type === vo.props.type &&
      this.props.appointedBy === vo.props.appointedBy &&
      this.props.appointmentDate.getTime() === vo.props.appointmentDate.getTime()
    );
  }
}
