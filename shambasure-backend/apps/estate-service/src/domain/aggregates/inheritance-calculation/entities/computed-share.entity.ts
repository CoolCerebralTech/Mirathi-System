import { AggregateRoot, Entity, UniqueEntityId } from '../../../core/domain';
import { ValidationError } from '../../../core/exceptions';
import {
  DateRangeVO,
  KenyanIdVO,
  MoneyVO,
  OwnershipPercentageVO,
  PercentageVO,
} from '../../shared';

export type ShareConditions = {
  isConditional: boolean;
  conditionType: 'AGE_REQUIREMENT' | 'SURVIVAL' | 'EDUCATION' | 'MARRIAGE' | 'ALTERNATE' | 'NONE';
  conditionDetails?: string;
  conditionMet: boolean;
  conditionDeadline?: Date;
  alternateBeneficiaryId?: string;
};

export type LifeInterestDetails = {
  hasLifeInterest: boolean;
  interestType: 'LIFE_ESTATE' | 'USUFRUCT' | 'TERM_CERTAIN';
  terminatesOn: 'DEATH' | 'REMARRIAGE' | 'SPECIFIC_DATE' | 'OTHER';
  terminationDate?: Date;
  terminationCondition?: string;
  residualBeneficiaries?: string[]; // Who gets it after life interest ends
};

export type PolygamousContext = {
  isPolygamousHouseShare: boolean;
  houseId?: string;
  houseName?: string;
  houseOrder?: number;
  isHouseHead: boolean;
  houseDissolved: boolean;
};

export type ShareBreakdown = {
  statutoryEntitlement: MoneyVO;
  hotchpotAdjustment: MoneyVO;
  dependantProvision: MoneyVO;
  customaryAdjustment: MoneyVO;
  courtOrderAdjustment: MoneyVO;
  netShare: MoneyVO;
};

export type ShareMetadata = {
  legalBasis: string; // "S.35(1)(b)", "S.40(2)", "S.29", etc.
  calculationVersion: number;
  lastRecalculatedAt: Date;
  assumptionsUsed: Record<string, any>;
  auditTrail: Array<{ timestamp: Date; action: string; details: string }>;
};

export interface ComputedShareProps {
  scenarioId: UniqueEntityId;
  beneficiaryId: KenyanIdVO;
  beneficiaryName: string;
  beneficiaryRelationship: string;

  // Core share calculations
  grossEntitlementPercent: PercentageVO;
  finalSharePercent: PercentageVO;
  finalShareValue: MoneyVO;

  // Legal context
  shareType: 'ABSOLUTE' | 'LIFE_INTEREST' | 'TRUST' | 'CONDITIONAL';
  lifeInterest?: LifeInterestDetails;
  conditions?: ShareConditions;

  // Adjustments
  breakdown: ShareBreakdown;

  // Context
  polygamousContext?: PolygamousContext;
  isMinor: boolean;
  requiresGuardian: boolean;

  // Status
  distributionStatus: 'PENDING' | 'APPROVED' | 'DISPUTED' | 'DISTRIBUTED' | 'DEFERRED';
  approvedAt?: Date;
  disputeDetails?: string;

  // Metadata
  metadata: ShareMetadata;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export class ComputedShare extends Entity<ComputedShareProps> {
  private constructor(props: ComputedShareProps, id?: UniqueEntityId) {
    super(props, id);
    this.validate();
  }

  static create(
    props: Omit<ComputedShareProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ): ComputedShare {
    const now = new Date();
    return new ComputedShare(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  private validate(): void {
    if (!this.props.scenarioId) {
      throw new ValidationError('Computed share must belong to a distribution scenario');
    }

    if (!this.props.beneficiaryId) {
      throw new ValidationError('Computed share must have a beneficiary');
    }

    if (this.props.finalSharePercent.value < 0 || this.props.finalSharePercent.value > 100) {
      throw new ValidationError('Final share percentage must be between 0-100%');
    }

    if (this.props.finalShareValue.amount < 0) {
      throw new ValidationError('Final share value cannot be negative');
    }

    // Validate life interest logic
    if (this.props.shareType === 'LIFE_INTEREST' && !this.props.lifeInterest) {
      throw new ValidationError('Life interest share must have life interest details');
    }

    if (this.props.shareType !== 'LIFE_INTEREST' && this.props.lifeInterest) {
      throw new ValidationError('Non-life interest share cannot have life interest details');
    }

    // Validate polygamous context
    if (this.props.polygamousContext?.isPolygamousHouseShare) {
      if (!this.props.polygamousContext.houseId) {
        throw new ValidationError('Polygamous house share must specify houseId');
      }
    }

    // Validate breakdown sums
    const calculatedNet =
      this.props.breakdown.statutoryEntitlement.amount +
      this.props.breakdown.hotchpotAdjustment.amount +
      this.props.breakdown.dependantProvision.amount +
      this.props.breakdown.customaryAdjustment.amount +
      this.props.breakdown.courtOrderAdjustment.amount;

    if (Math.abs(calculatedNet - this.props.breakdown.netShare.amount) > 0.01) {
      throw new ValidationError(
        `Breakdown sum (${calculatedNet}) must equal net share (${this.props.breakdown.netShare.amount})`,
      );
    }
  }

  // Domain methods
  updateShareValue(newValue: MoneyVO, reason: string): void {
    const oldValue = this.props.finalShareValue;
    this.props.finalShareValue = newValue;
    this.props.updatedAt = new Date();

    this.props.metadata.auditTrail.push({
      timestamp: new Date(),
      action: 'SHARE_VALUE_UPDATED',
      details: `Value changed from ${oldValue.amount} to ${newValue.amount}. Reason: ${reason}`,
    });
  }

  approveShare(approvedBy: string, notes?: string): void {
    if (this.props.distributionStatus === 'DISPUTED') {
      throw new ValidationError('Cannot approve a disputed share. Resolve dispute first.');
    }

    this.props.distributionStatus = 'APPROVED';
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    this.props.metadata.auditTrail.push({
      timestamp: new Date(),
      action: 'SHARE_APPROVED',
      details: `Approved by ${approvedBy}. ${notes || ''}`,
    });
  }

  disputeShare(reason: string, details: string): void {
    this.props.distributionStatus = 'DISPUTED';
    this.props.disputeDetails = `${reason}: ${details}`;
    this.props.updatedAt = new Date();

    this.props.metadata.auditTrail.push({
      timestamp: new Date(),
      action: 'SHARE_DISPUTED',
      details: `Dispute raised: ${reason} - ${details}`,
    });
  }

  markAsDistributed(distributionMethod: string, transactionReference?: string): void {
    if (this.props.distributionStatus !== 'APPROVED') {
      throw new ValidationError('Only approved shares can be marked as distributed');
    }

    this.props.distributionStatus = 'DISTRIBUTED';
    this.props.updatedAt = new Date();

    this.props.metadata.auditTrail.push({
      timestamp: new Date(),
      action: 'SHARE_DISTRIBUTED',
      details: `Distributed via ${distributionMethod}. Ref: ${transactionReference || 'N/A'}`,
    });
  }

  updateLifeInterestTermination(newTerminationDate: Date, reason: string): void {
    if (!this.props.lifeInterest) {
      throw new ValidationError(
        'Cannot update life interest termination for non-life interest share',
      );
    }

    this.props.lifeInterest.terminationDate = newTerminationDate;
    this.props.updatedAt = new Date();

    this.props.metadata.auditTrail.push({
      timestamp: new Date(),
      action: 'LIFE_INTEREST_UPDATED',
      details: `Termination date updated to ${newTerminationDate}. Reason: ${reason}`,
    });
  }

  checkConditionStatus(checkDate: Date = new Date()): {
    isSatisfied: boolean;
    remainingConditions?: string[];
    nextCheckDate?: Date;
  } {
    if (!this.props.conditions?.isConditional) {
      return { isSatisfied: true };
    }

    const conditions = this.props.conditions;
    const unmetConditions: string[] = [];

    // Check age requirement
    if (conditions.conditionType === 'AGE_REQUIREMENT' && conditions.conditionDeadline) {
      if (checkDate < conditions.conditionDeadline) {
        unmetConditions.push(`Age requirement not met until ${conditions.conditionDeadline}`);
      }
    }

    // Check survival condition (typically 30 days)
    if (conditions.conditionType === 'SURVIVAL' && conditions.conditionDeadline) {
      if (checkDate < conditions.conditionDeadline) {
        unmetConditions.push(`Survival period not completed until ${conditions.conditionDeadline}`);
      }
    }

    // Check specific date condition
    if (conditions.conditionType === 'NONE' && conditions.conditionDeadline) {
      if (checkDate < conditions.conditionDeadline) {
        unmetConditions.push(`Distribution not due until ${conditions.conditionDeadline}`);
      }
    }

    // Determine next check date
    let nextCheckDate: Date | undefined;
    if (conditions.conditionDeadline && checkDate < conditions.conditionDeadline) {
      nextCheckDate = conditions.conditionDeadline;
    }

    return {
      isSatisfied: unmetConditions.length === 0,
      remainingConditions: unmetConditions.length > 0 ? unmetConditions : undefined,
      nextCheckDate,
    };
  }

  calculateTaxImplications(taxRate: PercentageVO): {
    taxableAmount: MoneyVO;
    taxPayable: MoneyVO;
    netAfterTax: MoneyVO;
    taxDeadline?: Date;
  } {
    // Kenyan inheritance tax rules (currently no inheritance tax, but capital gains may apply)
    const taxableAmount = this.props.finalShareValue;
    const taxPayable = taxableAmount.multiply(taxRate.decimal);
    const netAfterTax = taxableAmount.subtract(taxPayable.amount);

    // Capital gains tax for property
    const hasProperty = this.props.metadata.assumptionsUsed?.includesProperty || false;
    const taxDeadline = hasProperty ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : undefined; // 90 days

    return {
      taxableAmount,
      taxPayable,
      netAfterTax,
      taxDeadline,
    };
  }

  generateDistributionSchedule(paymentFrequency: 'LUMP_SUM' | 'INSTALLMENTS'): {
    scheduleId: string;
    totalAmount: MoneyVO;
    installments: Array<{ dueDate: Date; amount: MoneyVO; status: 'PENDING' | 'PAID' }>;
    completionDate: Date;
  } {
    if (paymentFrequency === 'LUMP_SUM') {
      return {
        scheduleId: `SCHED_${this.id.toString()}_LUMP`,
        totalAmount: this.props.finalShareValue,
        installments: [
          {
            dueDate: new Date(),
            amount: this.props.finalShareValue,
            status: 'PENDING',
          },
        ],
        completionDate: new Date(),
      };
    }

    // Installment plan (e.g., 12 monthly installments)
    const installmentCount = 12;
    const installmentAmount = this.props.finalShareValue.divide(installmentCount);
    const installments: Array<{ dueDate: Date; amount: MoneyVO; status: 'PENDING' | 'PAID' }> = [];

    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      installments.push({
        dueDate,
        amount: installmentAmount,
        status: 'PENDING',
      });
    }

    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + installmentCount);

    return {
      scheduleId: `SCHED_${this.id.toString()}_INSTALLMENTS`,
      totalAmount: this.props.finalShareValue,
      installments,
      completionDate,
    };
  }

  getShareSummary(): {
    beneficiary: string;
    relationship: string;
    shareType: string;
    netValue: MoneyVO;
    percentage: PercentageVO;
    status: string;
    conditions: string[];
    nextAction?: string;
  } {
    const conditions: string[] = [];

    if (this.props.conditions?.isConditional) {
      conditions.push(`Condition: ${this.props.conditions.conditionType}`);
      if (this.props.conditions.conditionDeadline) {
        conditions.push(`Deadline: ${this.props.conditions.conditionDeadline.toDateString()}`);
      }
    }

    if (this.props.lifeInterest?.hasLifeInterest) {
      conditions.push(`Life interest terminates on: ${this.props.lifeInterest.terminatesOn}`);
      if (this.props.lifeInterest.terminationDate) {
        conditions.push(
          `Termination date: ${this.props.lifeInterest.terminationDate.toDateString()}`,
        );
      }
    }

    if (this.props.polygamousContext?.isPolygamousHouseShare) {
      conditions.push(`Polygamous house: ${this.props.polygamousContext.houseName}`);
      if (this.props.polygamousContext.isHouseHead) {
        conditions.push('House head (may receive additional responsibilities)');
      }
    }

    if (this.props.isMinor) {
      conditions.push('Minor beneficiary - requires guardian');
    }

    let nextAction: string | undefined;
    switch (this.props.distributionStatus) {
      case 'PENDING':
        nextAction = 'Awaiting approval';
        break;
      case 'APPROVED':
        nextAction = 'Ready for distribution';
        break;
      case 'DISPUTED':
        nextAction = 'Resolve dispute';
        break;
      case 'DISTRIBUTED':
        nextAction = 'Distribution complete';
        break;
      case 'DEFERRED':
        nextAction = 'Awaiting condition fulfillment';
        break;
    }

    return {
      beneficiary: this.props.beneficiaryName,
      relationship: this.props.beneficiaryRelationship,
      shareType: this.props.shareType,
      netValue: this.props.finalShareValue,
      percentage: this.props.finalSharePercent,
      status: this.props.distributionStatus,
      conditions,
      nextAction,
    };
  }

  // Getters
  get scenarioId(): UniqueEntityId {
    return this.props.scenarioId;
  }

  get beneficiaryId(): KenyanIdVO {
    return this.props.beneficiaryId;
  }

  get finalShareValue(): MoneyVO {
    return this.props.finalShareValue;
  }

  get distributionStatus(): string {
    return this.props.distributionStatus;
  }

  get isConditional(): boolean {
    return this.props.conditions?.isConditional || false;
  }

  get isLifeInterest(): boolean {
    return this.props.shareType === 'LIFE_INTEREST';
  }

  toJSON() {
    return {
      id: this.id.toString(),
      scenarioId: this.props.scenarioId.toString(),
      beneficiary: {
        id: this.props.beneficiaryId.value,
        name: this.props.beneficiaryName,
        relationship: this.props.beneficiaryRelationship,
        isMinor: this.props.isMinor,
        requiresGuardian: this.props.requiresGuardian,
      },
      share: {
        grossPercentage: this.props.grossEntitlementPercent.value,
        finalPercentage: this.props.finalSharePercent.value,
        finalValue: this.props.finalShareValue.toJSON(),
        type: this.props.shareType,
      },
      breakdown: {
        statutoryEntitlement: this.props.breakdown.statutoryEntitlement.toJSON(),
        hotchpotAdjustment: this.props.breakdown.hotchpotAdjustment.toJSON(),
        dependantProvision: this.props.breakdown.dependantProvision.toJSON(),
        customaryAdjustment: this.props.breakdown.customaryAdjustment.toJSON(),
        courtOrderAdjustment: this.props.breakdown.courtOrderAdjustment.toJSON(),
        netShare: this.props.breakdown.netShare.toJSON(),
      },
      conditions: this.props.conditions
        ? {
            isConditional: this.props.conditions.isConditional,
            conditionType: this.props.conditions.conditionType,
            conditionDetails: this.props.conditions.conditionDetails,
            conditionMet: this.props.conditions.conditionMet,
            conditionDeadline: this.props.conditions.conditionDeadline,
            alternateBeneficiaryId: this.props.conditions.alternateBeneficiaryId,
          }
        : undefined,
      lifeInterest: this.props.lifeInterest
        ? {
            hasLifeInterest: this.props.lifeInterest.hasLifeInterest,
            interestType: this.props.lifeInterest.interestType,
            terminatesOn: this.props.lifeInterest.terminatesOn,
            terminationDate: this.props.lifeInterest.terminationDate,
            terminationCondition: this.props.lifeInterest.terminationCondition,
            residualBeneficiaries: this.props.lifeInterest.residualBeneficiaries,
          }
        : undefined,
      polygamousContext: this.props.polygamousContext
        ? {
            isPolygamousHouseShare: this.props.polygamousContext.isPolygamousHouseShare,
            houseId: this.props.polygamousContext.houseId,
            houseName: this.props.polygamousContext.houseName,
            houseOrder: this.props.polygamousContext.houseOrder,
            isHouseHead: this.props.polygamousContext.isHouseHead,
            houseDissolved: this.props.polygamousContext.houseDissolved,
          }
        : undefined,
      status: {
        distributionStatus: this.props.distributionStatus,
        approvedAt: this.props.approvedAt,
        disputeDetails: this.props.disputeDetails,
      },
      metadata: {
        legalBasis: this.props.metadata.legalBasis,
        calculationVersion: this.props.metadata.calculationVersion,
        lastRecalculatedAt: this.props.metadata.lastRecalculatedAt,
        assumptionsUsed: this.props.metadata.assumptionsUsed,
        auditTrail: this.props.metadata.auditTrail.slice(-10), // Last 10 entries
      },
      timestamps: {
        createdAt: this.props.createdAt,
        updatedAt: this.props.updatedAt,
      },
      summary: this.getShareSummary(),
    };
  }
}
