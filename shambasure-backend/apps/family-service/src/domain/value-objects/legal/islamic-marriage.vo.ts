// domain/value-objects/legal/islamic-marriage.vo.ts
import { ValueObject } from '../base/value-object';

export type IslamicMarriageStatus = 'VALID' | 'SUSPENDED' | 'DISSOLVED' | 'PENDING_VALIDATION';

export type TalaqType =
  | 'TALAQ_AHSAN' // Single pronouncement followed by iddah
  | 'TALAQ_HASAN' // Three pronouncements over three months
  | 'TALAQ_AL_BIDDAH' // Three pronouncements in one sitting
  | 'KHULA' // Wife-initiated divorce
  | 'FASKH' // Judicial annulment
  | 'MUBARAT'; // Mutual agreement

export interface IslamicMarriageProps {
  nikahDate: Date;
  nikahLocation: string;
  imamName: string;
  mosqueName: string;
  waliName: string;
  waliRelationship: string;
  mahrAmount: number;
  mahrCurrency: string;
  mahrPaidInFull: boolean;
  mahrPaymentDate?: Date;
  deferredMahrAmount?: number;
  deferredMahrDueDate?: Date;
  witnesses: Array<{
    name: string;
    gender: 'MALE' | 'FEMALE';
    relationship: string;
  }>;
  marriageContractReference?: string;
  marriageConditions?: string[];
  status: IslamicMarriageStatus;
  talaqIssued: boolean;
  talaqType?: TalaqType;
  talaqDate?: Date;
  talaqCount: number;
  iddahPeriodEnds?: Date;
  reconciliationAttempted: boolean;
  reconciliationDate?: Date;
  khulaGranted: boolean;
  khulaDate?: Date;
  khulaAmount?: number;
  faskhGranted: boolean;
  faskhDate?: Date;
  faskhReason?: string;
  marriageRegisteredWithKadhi: boolean;
  kadhiCourtReference?: string;
  registrationDate?: Date;
}

export class IslamicMarriage extends ValueObject<IslamicMarriageProps> {
  private constructor(props: IslamicMarriageProps) {
    super(props);
    this.validate();
  }

  static create(
    nikahDate: Date,
    nikahLocation: string,
    imamName: string,
    waliName: string,
    mahrAmount: number,
  ): IslamicMarriage {
    return new IslamicMarriage({
      nikahDate,
      nikahLocation,
      imamName,
      mosqueName: '',
      waliName,
      waliRelationship: 'FATHER',
      mahrAmount,
      mahrCurrency: 'KES',
      mahrPaidInFull: false,
      witnesses: [],
      status: 'VALID',
      talaqIssued: false,
      talaqCount: 0,
      reconciliationAttempted: false,
      khulaGranted: false,
      faskhGranted: false,
      marriageRegisteredWithKadhi: false,
    });
  }

  static createFromProps(props: IslamicMarriageProps): IslamicMarriage {
    return new IslamicMarriage(props);
  }

  validate(): void {
    // Nikah date validation
    if (!this._value.nikahDate) {
      throw new Error('Nikah date is required');
    }

    if (this._value.nikahDate > new Date()) {
      throw new Error('Nikah cannot be in the future');
    }

    // Nikah location validation
    if (!this._value.nikahLocation || this._value.nikahLocation.trim().length === 0) {
      throw new Error('Nikah location is required');
    }

    // Imam validation
    if (!this._value.imamName || this._value.imamName.trim().length === 0) {
      throw new Error('Imam name is required');
    }

    // Wali validation
    if (!this._value.waliName || this._value.waliName.trim().length === 0) {
      throw new Error('Wali name is required');
    }

    // Mahr validation
    if (this._value.mahrAmount <= 0) {
      throw new Error('Mahr amount must be positive');
    }

    // Witness validation (minimum 2 male witnesses)
    const maleWitnesses = this._value.witnesses.filter((w) => w.gender === 'MALE');
    if (maleWitnesses.length < 2) {
      throw new Error('At least two male witnesses are required for Islamic marriage');
    }

    // Talaq validation
    if (this._value.talaqIssued) {
      if (!this._value.talaqType) {
        throw new Error('Talaq type is required when talaq is issued');
      }

      if (!this._value.talaqDate) {
        throw new Error('Talaq date is required when talaq is issued');
      }

      if (this._value.talaqDate < this._value.nikahDate) {
        throw new Error('Talaq cannot be before nikah');
      }

      if (this._value.talaqCount < 1 || this._value.talaqCount > 3) {
        throw new Error('Talaq count must be between 1 and 3');
      }
    }

    // Iddah period validation
    if (this._value.iddahPeriodEnds && this._value.talaqDate) {
      if (this._value.iddahPeriodEnds <= this._value.talaqDate) {
        throw new Error('Iddah period must end after talaq date');
      }
    }

    // Khula validation
    if (this._value.khulaGranted) {
      if (!this._value.khulaDate) {
        throw new Error('Khula date is required when khula is granted');
      }

      if (this._value.khulaDate < this._value.nikahDate) {
        throw new Error('Khula cannot be before nikah');
      }
    }

    // Faskh validation
    if (this._value.faskhGranted) {
      if (!this._value.faskhDate) {
        throw new Error('Faskh date is required when faskh is granted');
      }

      if (!this._value.faskhReason) {
        throw new Error('Faskh reason is required');
      }
    }

    // Kadhi court registration
    if (this._value.marriageRegisteredWithKadhi && !this._value.registrationDate) {
      throw new Error('Registration date is required when marriage is registered with Kadhi');
    }
  }

  updateMosqueDetails(mosqueName: string): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      mosqueName,
    });
  }

  updateWaliDetails(name: string, relationship: string): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      waliName: name,
      waliRelationship: relationship,
    });
  }

  payMahr(paymentDate: Date, paidInFull: boolean = true): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      mahrPaidInFull: paidInFull,
      mahrPaymentDate: paymentDate,
    });
  }

  setDeferredMahr(amount: number, dueDate: Date): IslamicMarriage {
    if (amount <= 0) {
      throw new Error('Deferred mahr amount must be positive');
    }

    if (dueDate <= this._value.nikahDate) {
      throw new Error('Deferred mahr due date must be after nikah date');
    }

    return new IslamicMarriage({
      ...this._value,
      deferredMahrAmount: amount,
      deferredMahrDueDate: dueDate,
    });
  }

  addWitness(name: string, gender: 'MALE' | 'FEMALE', relationship: string): IslamicMarriage {
    const witnesses = [...this._value.witnesses, { name, gender, relationship }];

    return new IslamicMarriage({
      ...this._value,
      witnesses,
    });
  }

  addMarriageCondition(condition: string): IslamicMarriage {
    const marriageConditions = [...(this._value.marriageConditions || []), condition];

    return new IslamicMarriage({
      ...this._value,
      marriageConditions,
    });
  }

  issueTalaq(talaqType: TalaqType, talaqDate: Date, count: number = 1): IslamicMarriage {
    if (count < 1 || count > 3) {
      throw new Error('Talaq count must be between 1 and 3');
    }

    if (talaqDate < this._value.nikahDate) {
      throw new Error('Talaq cannot be before nikah');
    }

    // Calculate iddah period (3 menstrual cycles or 3 months)
    const iddahEnds = new Date(talaqDate);
    iddahEnds.setMonth(iddahEnds.getMonth() + 3);

    return new IslamicMarriage({
      ...this._value,
      talaqIssued: true,
      talaqType,
      talaqDate,
      talaqCount: count,
      iddahPeriodEnds: iddahEnds,
      status: count === 3 ? 'DISSOLVED' : 'SUSPENDED',
    });
  }

  attemptReconciliation(reconciliationDate: Date): IslamicMarriage {
    if (!this._value.talaqIssued) {
      throw new Error('Cannot attempt reconciliation without talaq');
    }

    if (this._value.talaqCount === 3) {
      throw new Error('Cannot reconcile after third talaq');
    }

    return new IslamicMarriage({
      ...this._value,
      reconciliationAttempted: true,
      reconciliationDate,
    });
  }

  grantKhula(khulaDate: Date, amount?: number): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      khulaGranted: true,
      khulaDate,
      khulaAmount: amount,
      status: 'DISSOLVED',
    });
  }

  grantFaskh(faskhDate: Date, reason: string): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      faskhGranted: true,
      faskhDate,
      faskhReason: reason,
      status: 'DISSOLVED',
    });
  }

  registerWithKadhi(courtReference: string, registrationDate: Date): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      marriageRegisteredWithKadhi: true,
      kadhiCourtReference: courtReference,
      registrationDate,
    });
  }

  get nikahDate(): Date {
    return this._value.nikahDate;
  }

  get nikahLocation(): string {
    return this._value.nikahLocation;
  }

  get imamName(): string {
    return this._value.imamName;
  }

  get mosqueName(): string {
    return this._value.mosqueName;
  }

  get waliName(): string {
    return this._value.waliName;
  }

  get waliRelationship(): string {
    return this._value.waliRelationship;
  }

  get mahrAmount(): number {
    return this._value.mahrAmount;
  }

  get mahrCurrency(): string {
    return this._value.mahrCurrency;
  }

  get mahrPaidInFull(): boolean {
    return this._value.mahrPaidInFull;
  }

  get mahrPaymentDate(): Date | undefined {
    return this._value.mahrPaymentDate;
  }

  get deferredMahrAmount(): number | undefined {
    return this._value.deferredMahrAmount;
  }

  get deferredMahrDueDate(): Date | undefined {
    return this._value.deferredMahrDueDate;
  }

  get witnesses() {
    return [...this._value.witnesses];
  }

  get marriageContractReference(): string | undefined {
    return this._value.marriageContractReference;
  }

  get marriageConditions(): string[] | undefined {
    return this._value.marriageConditions;
  }

  get status(): IslamicMarriageStatus {
    return this._value.status;
  }

  get talaqIssued(): boolean {
    return this._value.talaqIssued;
  }

  get talaqType(): TalaqType | undefined {
    return this._value.talaqType;
  }

  get talaqDate(): Date | undefined {
    return this._value.talaqDate;
  }

  get talaqCount(): number {
    return this._value.talaqCount;
  }

  get iddahPeriodEnds(): Date | undefined {
    return this._value.iddahPeriodEnds;
  }

  get reconciliationAttempted(): boolean {
    return this._value.reconciliationAttempted;
  }

  get reconciliationDate(): Date | undefined {
    return this._value.reconciliationDate;
  }

  get khulaGranted(): boolean {
    return this._value.khulaGranted;
  }

  get khulaDate(): Date | undefined {
    return this._value.khulaDate;
  }

  get khulaAmount(): number | undefined {
    return this._value.khulaAmount;
  }

  get faskhGranted(): boolean {
    return this._value.faskhGranted;
  }

  get faskhDate(): Date | undefined {
    return this._value.faskhDate;
  }

  get faskhReason(): string | undefined {
    return this._value.faskhReason;
  }

  get marriageRegisteredWithKadhi(): boolean {
    return this._value.marriageRegisteredWithKadhi;
  }

  get kadhiCourtReference(): string | undefined {
    return this._value.kadhiCourtReference;
  }

  get registrationDate(): Date | undefined {
    return this._value.registrationDate;
  }

  // Get marriage duration in years
  get marriageDurationYears(): number {
    const endDate =
      this._value.talaqDate || this._value.khulaDate || this._value.faskhDate || new Date();

    const diffYears = endDate.getFullYear() - this._value.nikahDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.nikahDate.getMonth();

    return monthDiff < 0 ? diffYears - 1 : diffYears;
  }

  // Check if marriage is currently valid
  get isValidMarriage(): boolean {
    return this._value.status === 'VALID';
  }

  // Check if marriage is irrevocably dissolved
  get isIrrevocablyDissolved(): boolean {
    return this._value.talaqCount === 3 || this._value.khulaGranted || this._value.faskhGranted;
  }

  // Check if iddah period is active
  get isIddahPeriodActive(): boolean {
    if (!this._value.iddahPeriodEnds) return false;
    return new Date() <= this._value.iddahPeriodEnds;
  }

  // Get days remaining in iddah
  get iddahDaysRemaining(): number | null {
    if (!this._value.iddahPeriodEnds) return null;

    const now = new Date();
    const diffTime = this._value.iddahPeriodEnds.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get total mahr due (immediate + deferred)
  get totalMahrDue(): number {
    return this._value.mahrAmount + (this._value.deferredMahrAmount || 0);
  }

  // Get mahr paid so far
  get mahrPaid(): number {
    if (this._value.mahrPaidInFull) return this.totalMahrDue;

    const immediatePaid = this._value.mahrPaymentDate ? this._value.mahrAmount : 0;
    const deferredPaid = 0; // Assume deferred mahr not paid unless specified

    return immediatePaid + deferredPaid;
  }

  // Check if marriage is registered with authorities
  get isLegallyRegistered(): boolean {
    return this._value.marriageRegisteredWithKadhi;
  }

  // Get male witnesses count
  get maleWitnessCount(): number {
    return this._value.witnesses.filter((w) => w.gender === 'MALE').length;
  }

  toJSON() {
    return {
      nikahDate: this._value.nikahDate.toISOString(),
      nikahLocation: this._value.nikahLocation,
      imamName: this._value.imamName,
      mosqueName: this._value.mosqueName,
      waliName: this._value.waliName,
      waliRelationship: this._value.waliRelationship,
      mahrAmount: this._value.mahrAmount,
      mahrCurrency: this._value.mahrCurrency,
      mahrPaidInFull: this._value.mahrPaidInFull,
      mahrPaymentDate: this._value.mahrPaymentDate?.toISOString(),
      deferredMahrAmount: this._value.deferredMahrAmount,
      deferredMahrDueDate: this._value.deferredMahrDueDate?.toISOString(),
      witnesses: this._value.witnesses,
      marriageContractReference: this._value.marriageContractReference,
      marriageConditions: this._value.marriageConditions,
      status: this._value.status,
      talaqIssued: this._value.talaqIssued,
      talaqType: this._value.talaqType,
      talaqDate: this._value.talaqDate?.toISOString(),
      talaqCount: this._value.talaqCount,
      iddahPeriodEnds: this._value.iddahPeriodEnds?.toISOString(),
      reconciliationAttempted: this._value.reconciliationAttempted,
      reconciliationDate: this._value.reconciliationDate?.toISOString(),
      khulaGranted: this._value.khulaGranted,
      khulaDate: this._value.khulaDate?.toISOString(),
      khulaAmount: this._value.khulaAmount,
      faskhGranted: this._value.faskhGranted,
      faskhDate: this._value.faskhDate?.toISOString(),
      faskhReason: this._value.faskhReason,
      marriageRegisteredWithKadhi: this._value.marriageRegisteredWithKadhi,
      kadhiCourtReference: this._value.kadhiCourtReference,
      registrationDate: this._value.registrationDate?.toISOString(),
      marriageDurationYears: this.marriageDurationYears,
      isValidMarriage: this.isValidMarriage,
      isIrrevocablyDissolved: this.isIrrevocablyDissolved,
      isIddahPeriodActive: this.isIddahPeriodActive,
      iddahDaysRemaining: this.iddahDaysRemaining,
      totalMahrDue: this.totalMahrDue,
      mahrPaid: this.mahrPaid,
      isLegallyRegistered: this.isLegallyRegistered,
      maleWitnessCount: this.maleWitnessCount,
    };
  }
}
