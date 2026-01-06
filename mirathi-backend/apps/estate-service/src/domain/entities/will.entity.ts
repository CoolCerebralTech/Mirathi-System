import { WillStatus } from '@prisma/client';

import { WillCompleteness } from '../value-objects/will-completeness.vo';

export interface WillProps {
  id: string;
  userId: string;
  testatorName: string;
  status: WillStatus;
  versionNumber: number;
  executorName?: string;
  executorPhone?: string;
  executorEmail?: string;
  executorRelationship?: string;
  funeralWishes?: string;
  burialLocation?: string;
  specialInstructions?: string;
  hasExecutor: boolean;
  hasBeneficiaries: boolean;
  hasWitnesses: boolean;
  isComplete: boolean;
  completenessScore: number;
  validationWarnings: string[];
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

export class Will {
  private constructor(private props: WillProps) {}

  static create(userId: string, testatorName: string): Will {
    return new Will({
      id: crypto.randomUUID(),
      userId,
      testatorName,
      status: WillStatus.DRAFT,
      versionNumber: 1,
      hasExecutor: false,
      hasBeneficiaries: false,
      hasWitnesses: false,
      isComplete: false,
      completenessScore: 0,
      validationWarnings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: WillProps): Will {
    return new Will(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get testatorName(): string {
    return this.props.testatorName;
  }
  get status(): WillStatus {
    return this.props.status;
  }
  get isComplete(): boolean {
    return this.props.isComplete;
  }
  get completenessScore(): number {
    return this.props.completenessScore;
  }

  // Business Logic
  appointExecutor(name: string, phone?: string, email?: string, relationship?: string): void {
    this.props.executorName = name;
    this.props.executorPhone = phone;
    this.props.executorEmail = email;
    this.props.executorRelationship = relationship;
    this.props.hasExecutor = true;
    this.props.updatedAt = new Date();
  }

  addFuneralWishes(wishes: string, burialLocation?: string): void {
    this.props.funeralWishes = wishes;
    this.props.burialLocation = burialLocation;
    this.props.updatedAt = new Date();
  }

  updateCompleteness(beneficiaryCount: number, witnessCount: number): void {
    const completeness = WillCompleteness.calculate(
      this.props.hasExecutor,
      beneficiaryCount,
      witnessCount,
    );

    this.props.hasBeneficiaries = completeness.hasBeneficiaries;
    this.props.hasWitnesses = completeness.hasWitnesses;
    this.props.isComplete = completeness.isComplete;
    this.props.completenessScore = completeness.score;
    this.props.validationWarnings = completeness.warnings;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (!this.props.isComplete) {
      throw new Error('Cannot activate incomplete will');
    }
    this.props.status = WillStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  revoke(): void {
    this.props.status = WillStatus.REVOKED;
    this.props.updatedAt = new Date();
  }

  execute(): void {
    this.props.status = WillStatus.EXECUTED;
    this.props.executedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toJSON(): WillProps {
    return { ...this.props };
  }
}
