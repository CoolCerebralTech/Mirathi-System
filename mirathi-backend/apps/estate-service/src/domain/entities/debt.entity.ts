export enum DebtCategory {
  MORTGAGE = 'MORTGAGE',
  BANK_LOAN = 'BANK_LOAN',
  SACCO_LOAN = 'SACCO_LOAN',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  MOBILE_LOAN = 'MOBILE_LOAN',
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES',
  MEDICAL_BILLS = 'MEDICAL_BILLS',
  TAXES_OWED = 'TAXES_OWED',
  OTHER = 'OTHER',
}

export enum DebtPriority {
  CRITICAL = 'CRITICAL', // Funeral, taxes (S.45 LSA)
  HIGH = 'HIGH', // Secured debts
  MEDIUM = 'MEDIUM', // Priority unsecured
  LOW = 'LOW', // General unsecured
}

export enum DebtStatus {
  OUTSTANDING = 'OUTSTANDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID_IN_FULL = 'PAID_IN_FULL',
  DISPUTED = 'DISPUTED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export interface DebtProps {
  id: string;
  estateId: string;
  creditorName: string;
  creditorContact?: string;
  description: string;
  category: DebtCategory;
  priority: DebtPriority;
  status: DebtStatus;
  originalAmount: number;
  outstandingBalance: number;
  currency: string;
  dueDate?: Date;
  isSecured: boolean;
  securityDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Debt {
  private constructor(private props: DebtProps) {}

  static create(
    estateId: string,
    creditorName: string,
    description: string,
    category: DebtCategory,
    priority: DebtPriority,
    originalAmount: number,
    outstandingBalance: number,
  ): Debt {
    if (originalAmount < 0 || outstandingBalance < 0) {
      throw new Error('Debt amounts cannot be negative');
    }

    if (outstandingBalance > originalAmount) {
      throw new Error('Outstanding balance cannot exceed original amount');
    }

    return new Debt({
      id: crypto.randomUUID(),
      estateId,
      creditorName,
      description,
      category,
      priority,
      status: DebtStatus.OUTSTANDING,
      originalAmount,
      outstandingBalance,
      currency: 'KES',
      isSecured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: DebtProps): Debt {
    return new Debt(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get creditorName(): string {
    return this.props.creditorName;
  }
  get category(): DebtCategory {
    return this.props.category;
  }
  get priority(): DebtPriority {
    return this.props.priority;
  }
  get originalAmount(): number {
    return this.props.originalAmount;
  }
  get outstandingBalance(): number {
    return this.props.outstandingBalance;
  }
  get status(): DebtStatus {
    return this.props.status;
  }
  get isSecured(): boolean {
    return this.props.isSecured;
  }

  // Business Logic
  makePayment(amount: number): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (amount > this.props.outstandingBalance) {
      throw new Error('Payment exceeds outstanding balance');
    }

    this.props.outstandingBalance -= amount;

    if (this.props.outstandingBalance === 0) {
      this.props.status = DebtStatus.PAID_IN_FULL;
    } else {
      this.props.status = DebtStatus.PARTIALLY_PAID;
    }

    this.props.updatedAt = new Date();
  }

  dispute(): void {
    this.props.status = DebtStatus.DISPUTED;
    this.props.updatedAt = new Date();
  }

  writeOff(): void {
    this.props.status = DebtStatus.WRITTEN_OFF;
    this.props.outstandingBalance = 0;
    this.props.updatedAt = new Date();
  }

  secure(details: string): void {
    this.props.isSecured = true;
    this.props.securityDetails = details;
    this.props.updatedAt = new Date();
  }

  toJSON(): DebtProps {
    return { ...this.props };
  }
}
