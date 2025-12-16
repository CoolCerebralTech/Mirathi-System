// domain/value-objects/legal/islamic-marriage.vo.ts
import { ValueObject } from '../../base/value-object';

export type IslamicMarriageStatus = 'VALID' | 'SUSPENDED' | 'DISSOLVED' | 'PENDING_VALIDATION';

export type TalaqType =
  | 'TALAQ_AHSAN' // Single pronouncement followed by iddah
  | 'TALAQ_HASAN' // Three pronouncements over three months
  | 'TALAQ_AL_BIDDAH' // Three pronouncements in one sitting
  | 'KHULA' // Wife-initiated divorce
  | 'FASKH' // Judicial annulment
  | 'MUBARAT'; // Mutual agreement

export interface Witness {
  name: string;
  gender: 'MALE' | 'FEMALE';
  relationship: string;
}

export interface IslamicMarriageProps {
  nikahDate: Date;
  nikahLocation: string;
  imamName: string;
  mosqueName: string;
  waliName: string;
  waliRelationship: string;

  // Mahr (Dowry)
  mahrAmount: number;
  mahrCurrency: string;
  mahrPaidInFull: boolean;
  mahrPaymentDate?: Date;
  deferredMahrAmount?: number;
  deferredMahrDueDate?: Date;

  witnesses: Witness[];

  // Contract
  marriageContractReference?: string;
  marriageConditions?: string[];
  status: IslamicMarriageStatus;

  // Dissolution - Talaq
  talaqIssued: boolean;
  talaqType?: TalaqType;
  talaqDate?: Date;
  talaqCount: number;
  iddahPeriodEnds?: Date;

  // Dissolution - Reconciliation
  reconciliationAttempted: boolean;
  reconciliationDate?: Date;

  // Dissolution - Khula
  khulaGranted: boolean;
  khulaDate?: Date;
  khulaAmount?: number;

  // Dissolution - Faskh
  faskhGranted: boolean;
  faskhDate?: Date;
  faskhReason?: string;

  // Legal Registration
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
    if (!this._value.nikahDate) {
      throw new Error('Nikah date is required');
    }

    if (this._value.mahrAmount < 0) {
      throw new Error('Mahr amount cannot be negative');
    }

    // Talaq validation logic
    if (this._value.talaqIssued) {
      if (!this._value.talaqDate) {
        throw new Error('Talaq date is required when talaq is issued');
      }
      if (this._value.talaqCount < 1 || this._value.talaqCount > 3) {
        throw new Error('Talaq count must be between 1 and 3');
      }
    }
  }

  // --- Actions ---

  addWitness(name: string, gender: 'MALE' | 'FEMALE', relationship: string): IslamicMarriage {
    const witnesses = [...this._value.witnesses, { name, gender, relationship }];
    return new IslamicMarriage({ ...this._value, witnesses });
  }

  payMahr(paymentDate: Date, paidInFull: boolean = true): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      mahrPaidInFull: paidInFull,
      mahrPaymentDate: paymentDate,
    });
  }

  issueTalaq(talaqType: TalaqType, talaqDate: Date, count: number = 1): IslamicMarriage {
    if (count < 1 || count > 3) {
      throw new Error('Talaq count must be between 1 and 3');
    }

    // Calculate iddah period (approx 3 months)
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

  grantKhula(khulaDate: Date, amount?: number): IslamicMarriage {
    return new IslamicMarriage({
      ...this._value,
      khulaGranted: true,
      khulaDate,
      khulaAmount: amount,
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

  // --- Getters ---

  get nikahDate(): Date {
    return this._value.nikahDate;
  }
  get waliName(): string {
    return this._value.waliName;
  }
  get mahrValue(): number {
    return this._value.mahrAmount;
  }
  get mahrCurrency(): string {
    return this._value.mahrCurrency;
  }
  get isTalaqIssued(): boolean {
    return this._value.talaqIssued;
  }

  // --- Serialization ---

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
    };
  }
}
