export interface EstateProps {
  id: string;
  userId: string;
  userName: string;
  kraPin?: string;
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  isInsolvent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Estate {
  private constructor(private props: EstateProps) {}

  static create(userId: string, userName: string, kraPin?: string): Estate {
    return new Estate({
      id: crypto.randomUUID(),
      userId,
      userName,
      kraPin,
      totalAssets: 0,
      totalDebts: 0,
      netWorth: 0,
      isInsolvent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: EstateProps): Estate {
    return new Estate(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get userName(): string {
    return this.props.userName;
  }
  get kraPin(): string | undefined {
    return this.props.kraPin;
  }
  get totalAssets(): number {
    return this.props.totalAssets;
  }
  get totalDebts(): number {
    return this.props.totalDebts;
  }
  get netWorth(): number {
    return this.props.netWorth;
  }
  get isInsolvent(): boolean {
    return this.props.isInsolvent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic
  recalculateNetWorth(assets: number, debts: number): void {
    this.props.totalAssets = assets;
    this.props.totalDebts = debts;
    this.props.netWorth = assets - debts;
    this.props.isInsolvent = this.props.netWorth < 0;
    this.props.updatedAt = new Date();
  }

  updateKraPin(kraPin: string): void {
    this.props.kraPin = kraPin;
    this.props.updatedAt = new Date();
  }

  toJSON(): EstateProps {
    return { ...this.props };
  }
}
