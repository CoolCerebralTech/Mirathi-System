// infrastructure/mappers/guardianship.mapper.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { Guardian, GuardianProps } from '../../../domain/entities/guardian.entity';
import { KenyanMoney } from '../../../domain/value-objects/financial/kenyan-money.vo';
import { CourtOrder } from '../../../domain/value-objects/legal/court-order.vo';
import { GuardianBond } from '../../../domain/value-objects/legal/guardian-bond.vo';
import { GuardianPowers } from '../../../domain/value-objects/legal/guardian-powers.vo';
import { ReportingSchedule } from '../../../domain/value-objects/legal/reporting-schedule.vo';

// Prisma types for the aggregate
type PrismaGuardianship = {
  id: string;
  wardId: string;
  wardInfo: any;
  isActive: boolean;
  establishedDate: Date;
  dissolvedDate?: Date | null;
  dissolutionReason?: string | null;
  customaryLawApplies: boolean;
  customaryDetails?: any;
  courtOrder?: any;
  primaryGuardianId?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Include related guardians
  guardians?: PrismaGuardian[];
};

type PrismaGuardian = {
  id: string;
  wardId: string;
  guardianId: string;
  type: string;
  courtOrderNumber?: string | null;
  courtStation?: string | null;
  appointmentDate: Date;
  validUntil?: Date | null;
  hasPropertyManagementPowers: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean;
  restrictions?: any;
  specialInstructions?: string | null;
  guardianIdNumber?: string | null;
  courtCaseNumber?: string | null;
  interimOrderId?: string | null;
  bondRequired: boolean;
  bondAmountKES?: number | null;
  bondProvider?: string | null;
  bondPolicyNumber?: string | null;
  bondExpiry?: Date | null;
  lastReportDate?: Date | null;
  nextReportDue?: Date | null;
  reportStatus?: string | null;
  annualAllowanceKES?: number | null;
  allowanceApprovedBy?: string | null;
  isActive: boolean;
  terminationDate?: Date | null;
  terminationReason?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GuardianshipMapper {
  private readonly logger = new Logger(GuardianshipMapper.name);

  /**
   * Converts Prisma Guardianship record to Domain GuardianshipAggregate
   */
  toDomain(raw: PrismaGuardianship | null): GuardianshipAggregate | null {
    if (!raw) return null;

    try {
      // 1. Convert guardians from Prisma to domain entities
      const guardians = new Map<string, Guardian>();

      if (raw.guardians) {
        for (const guardianData of raw.guardians) {
          const guardian = this.mapPrismaGuardianToDomain(guardianData);
          guardians.set(guardian.guardianId.toString(), guardian);
        }
      }

      // 2. Build aggregate props
      const props = {
        wardInfo: raw.wardInfo,
        guardians,
        primaryGuardianId: raw.primaryGuardianId ?? undefined,
        establishedDate: raw.establishedDate,
        customaryLawApplies: raw.customaryLawApplies,
        customaryDetails: raw.customaryDetails,
        courtOrder: raw.courtOrder ? this.mapToCourtOrder(raw.courtOrder) : undefined,
        isActive: raw.isActive,
        dissolvedDate: raw.dissolvedDate ?? undefined,
        dissolutionReason: raw.dissolutionReason ?? undefined,
      };

      // 3. Create aggregate using fromPersistence
      return GuardianshipAggregate.fromPersistence(raw.id, props, raw.createdAt);
    } catch (error) {
      this.logger.error(`Failed to reconstitute Guardianship ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for Guardianship ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Maps Prisma guardian record to domain Guardian entity
   */
  private mapPrismaGuardianToDomain(raw: PrismaGuardian): Guardian {
    // Build guardian powers
    const powers = GuardianPowers.create({
      hasPropertyManagementPowers: raw.hasPropertyManagementPowers,
      canConsentToMedical: raw.canConsentToMedical,
      canConsentToMarriage: raw.canConsentToMarriage,
      restrictions: Array.isArray(raw.restrictions) ? raw.restrictions : [],
      specialInstructions: raw.specialInstructions ?? undefined,
    });

    // Build reporting schedule if needed
    let reportingSchedule: ReportingSchedule | undefined;
    if (raw.hasPropertyManagementPowers && raw.nextReportDue) {
      reportingSchedule = ReportingSchedule.create({
        firstReportDue: raw.nextReportDue,
        frequency: 'ANNUAL',
        status: raw.reportStatus as any,
        lastReportDate: raw.lastReportDate ?? undefined,
      });
    }

    // Build bond if posted
    let bond: GuardianBond | undefined;
    if (raw.bondProvider && raw.bondPolicyNumber && raw.bondAmountKES && raw.bondExpiry) {
      bond = GuardianBond.create({
        provider: raw.bondProvider,
        policyNumber: raw.bondPolicyNumber,
        amount: KenyanMoney.create(raw.bondAmountKES),
        issuedDate: raw.appointmentDate, // Assuming bond issued on appointment
        expiryDate: raw.bondExpiry,
      });
    }

    // Build court order if exists
    let courtOrder: CourtOrder | undefined;
    if (raw.courtOrderNumber && raw.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: raw.courtOrderNumber,
        courtStation: raw.courtStation,
        orderDate: raw.appointmentDate,
        orderType: 'GUARDIAN_APPOINTMENT',
      });
    }

    // Build allowance if exists
    let annualAllowance: KenyanMoney | undefined;
    if (raw.annualAllowanceKES) {
      annualAllowance = KenyanMoney.create(raw.annualAllowanceKES);
    }

    // Build guardian props
    const guardianProps: GuardianProps = {
      wardId: new UniqueEntityID(raw.wardId),
      guardianId: new UniqueEntityID(raw.guardianId),
      type: raw.type as any,
      courtOrder,
      appointmentDate: raw.appointmentDate,
      validUntil: raw.validUntil ?? undefined,
      powers,
      bond,
      reportingSchedule,
      annualAllowance,
      allowanceApprovedBy: raw.allowanceApprovedBy
        ? new UniqueEntityID(raw.allowanceApprovedBy)
        : undefined,
      isActive: raw.isActive,
      terminationDate: raw.terminationDate ?? undefined,
      terminationReason: raw.terminationReason as any,
      customaryLawApplies: false, // From guardianship level, not guardian
      bondRequired: raw.bondRequired,
    };

    // Create guardian entity
    return Guardian.fromPersistence(raw.id, guardianProps, raw.createdAt);
  }

  /**
   * Maps JSON court order to CourtOrder value object
   */
  private mapToCourtOrder(courtOrderData: any): CourtOrder {
    return CourtOrder.create({
      orderNumber: courtOrderData.orderNumber,
      courtStation: courtOrderData.courtStation,
      orderDate: new Date(courtOrderData.orderDate),
      orderType: courtOrderData.orderType,
      judgeName: courtOrderData.judgeName,
      courtCaseNumber: courtOrderData.courtCaseNumber,
    });
  }

  /**
   * Converts Domain GuardianshipAggregate to Prisma create input
   */
  toPrismaCreate(aggregate: GuardianshipAggregate): Prisma.GuardianshipCreateInput {
    const props = aggregate['_props']; // Access private props

    // Convert guardians for nested create
    const guardians = Array.from(props.guardians.values());
    const guardianCreates = guardians.map((guardian) =>
      this.mapGuardianToPrismaCreate(guardian, aggregate.id.toString()),
    );

    return {
      id: aggregate.id.toString(),
      wardId: props.wardInfo.wardId,
      wardInfo: props.wardInfo,
      isActive: props.isActive,
      establishedDate: props.establishedDate,
      dissolvedDate: props.dissolvedDate,
      dissolutionReason: props.dissolutionReason,
      customaryLawApplies: props.customaryLawApplies,
      customaryDetails: props.customaryDetails as any,
      courtOrder: props.courtOrder?.toJSON(),
      primaryGuardianId: props.primaryGuardianId,
      version: aggregate['_version'],
      guardians: {
        create: guardianCreates,
      },
    };
  }

  /**
   * Converts Domain GuardianshipAggregate to Prisma update input
   */
  toPrismaUpdate(aggregate: GuardianshipAggregate): Prisma.GuardianshipUpdateInput {
    const props = aggregate['_props'];

    return {
      wardInfo: props.wardInfo,
      isActive: props.isActive,
      dissolvedDate: props.dissolvedDate,
      dissolutionReason: props.dissolutionReason,
      customaryLawApplies: props.customaryLawApplies,
      customaryDetails: props.customaryDetails as any,
      courtOrder: props.courtOrder?.toJSON(),
      primaryGuardianId: props.primaryGuardianId,
      version: aggregate['_version'],
      updatedAt: new Date(),
    };
  }

  /**
   * Maps domain Guardian entity to Prisma create input
   */
  private mapGuardianToPrismaCreate(
    guardian: Guardian,
    guardianshipId: string,
  ): Prisma.GuardianCreateInput {
    const props = guardian['_props'];
    const powers = props.powers;
    const bond = props.bond;
    const reportingSchedule = props.reportingSchedule;

    return {
      id: guardian.id.toString(),
      guardianship: { connect: { id: guardianshipId } },
      ward: { connect: { id: props.wardId.toString() } },
      guardianUser: { connect: { id: props.guardianId.toString() } },
      type: props.type,
      courtOrderNumber: props.courtOrder?.orderNumber,
      courtStation: props.courtOrder?.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: powers.hasPropertyManagementPowers,
      canConsentToMedical: powers.canConsentToMedical,
      canConsentToMarriage: powers.canConsentToMarriage,
      restrictions: powers.restrictions as any,
      specialInstructions: powers.specialInstructions,
      guardianIdNumber: undefined, // Not in domain model
      courtCaseNumber: props.courtOrder?.courtCaseNumber,
      bondRequired: guardian.requiresBond(),
      bondAmountKES: bond?.amount.getAmount(),
      bondProvider: bond?.provider,
      bondPolicyNumber: bond?.policyNumber,
      bondExpiry: bond?.expiryDate,
      lastReportDate: reportingSchedule?.lastReportDate,
      nextReportDue: reportingSchedule?.nextReportDue,
      reportStatus: reportingSchedule?.status,
      annualAllowanceKES: props.annualAllowance?.getAmount(),
      allowanceApprovedBy: props.allowanceApprovedBy?.toString(),
      isActive: props.isActive,
      terminationDate: props.terminationDate,
      terminationReason: props.terminationReason,
      version: guardian['_version'],
    };
  }

  /**
   * Maps domain Guardian entity to Prisma update input
   */
  private mapGuardianToPrismaUpdate(guardian: Guardian): Prisma.GuardianUpdateInput {
    const props = guardian['_props'];
    const powers = props.powers;
    const bond = props.bond;
    const reportingSchedule = props.reportingSchedule;

    return {
      type: props.type,
      courtOrderNumber: props.courtOrder?.orderNumber,
      courtStation: props.courtOrder?.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: powers.hasPropertyManagementPowers,
      canConsentToMedical: powers.canConsentToMedical,
      canConsentToMarriage: powers.canConsentToMarriage,
      restrictions: powers.restrictions as any,
      specialInstructions: powers.specialInstructions,
      bondRequired: guardian.requiresBond(),
      bondAmountKES: bond?.amount.getAmount(),
      bondProvider: bond?.provider,
      bondPolicyNumber: bond?.policyNumber,
      bondExpiry: bond?.expiryDate,
      lastReportDate: reportingSchedule?.lastReportDate,
      nextReportDue: reportingSchedule?.nextReportDue,
      reportStatus: reportingSchedule?.status,
      annualAllowanceKES: props.annualAllowance?.getAmount(),
      allowanceApprovedBy: props.allowanceApprovedBy?.toString(),
      isActive: props.isActive,
      terminationDate: props.terminationDate,
      terminationReason: props.terminationReason,
      version: guardian['_version'],
      updatedAt: new Date(),
    };
  }

  // --- Query Helpers ---

  createWhereById(id: string): Prisma.GuardianshipWhereUniqueInput {
    return { id };
  }

  createWhereByWardId(wardId: string): Prisma.GuardianshipWhereInput {
    return { wardId, isActive: true };
  }

  createWhereByGuardianId(guardianId: string): Prisma.GuardianshipWhereInput {
    return {
      guardians: {
        some: {
          guardianId,
          isActive: true,
        },
      },
      isActive: true,
    };
  }

  includeGuardians(): Prisma.GuardianshipInclude {
    return {
      guardians: true,
    };
  }

  /**
   * Creates a list of guardian updates for a guardianship update
   */
  createGuardianUpdates(aggregate: GuardianshipAggregate): {
    create?: Prisma.GuardianCreateWithoutGuardianshipInput[];
    update?: Prisma.GuardianUpdateWithWhereUniqueWithoutGuardianshipInput[];
    delete?: Prisma.GuardianWhereUniqueInput[];
  } {
    const props = aggregate['_props'];
    const guardians = Array.from(props.guardians.values());

    // For simplicity, we'll just update all guardians
    // In real implementation, you'd track changes
    const updates = guardians.map((guardian) => ({
      where: { id: guardian.id.toString() },
      data: this.mapGuardianToPrismaUpdate(guardian),
    }));

    return {
      update: updates,
    };
  }
}
