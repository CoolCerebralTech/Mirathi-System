import {
  Prisma,
  Asset as PrismaAsset,
  BeneficiaryAssignment as PrismaBeneficiary,
  WillExecutor as PrismaExecutor,
  Will as PrismaWill,
  WillWitness as PrismaWitness,
} from '@prisma/client';

import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import { Will, WillReconstituteProps } from '../../../domain/entities/will.entity';

type WillWithRelations = PrismaWill & {
  assets?: PrismaAsset[];
  beneficiaries?: PrismaBeneficiary[];
  executors?: PrismaExecutor[];
  witnesses?: PrismaWitness[];
};

export class WillMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: WillWithRelations): WillAggregate {
    // 1. Safe JSON extraction for complex fields
    const funeralWishes = this.parseFuneralWishes(raw.funeralWishes);
    const digitalAssetInstructions = this.parseDigitalAssetInstructions(
      raw.digitalAssetInstructions,
    );
    const legalCapacityAssessment = this.parseLegalCapacityAssessment(raw.legalCapacityAssessment);

    // 2. Construct Reconstruction Props with ALL fields
    const rootProps: WillReconstituteProps = {
      // Core Identity
      id: raw.id,
      title: raw.title,
      testatorId: raw.testatorId,

      // Will Classification
      type: raw.type,
      status: raw.status,

      // Legal Capacity (Section 7 Law of Succession Act)
      legalCapacityStatus: raw.legalCapacityStatus,
      legalCapacityAssessment: legalCapacityAssessment,
      legalCapacityAssessedBy: raw.legalCapacityAssessedBy,
      legalCapacityAssessedAt: raw.legalCapacityAssessedAt,
      medicalCertificationId: raw.medicalCertificationId,

      // Will Dates & Versioning
      willDate: raw.willDate,
      lastModified: raw.lastModified,
      versionNumber: raw.versionNumber,
      supersedes: raw.supersedes,

      // Activation & Execution
      activatedAt: raw.activatedAt,
      activatedBy: raw.activatedBy,
      executedAt: raw.executedAt,
      executedBy: raw.executedBy,

      // Revocation (Section 16)
      isRevoked: raw.isRevoked,
      revokedAt: raw.revokedAt,
      revokedBy: raw.revokedBy,
      revocationMethod: raw.revocationMethod,
      revocationReason: raw.revocationReason,

      // Kenyan-Specific Content
      funeralWishes: funeralWishes,
      burialLocation: raw.burialLocation,
      cremationInstructions: raw.cremationInstructions,
      organDonation: raw.organDonation,
      organDonationDetails: raw.organDonationDetails,

      // Estate Distribution
      residuaryClause: raw.residuaryClause,
      digitalAssetInstructions: digitalAssetInstructions,
      specialInstructions: raw.specialInstructions,

      // Witness Management (Kenyan Legal Requirements)
      requiresWitnesses: raw.requiresWitnesses,
      witnessCount: raw.witnessCount,
      hasAllWitnesses: raw.hasAllWitnesses,
      minimumWitnessesRequired: raw.minimumWitnessesRequired,

      // Legal Formalities (Kenyan Law Compliance)
      isHolographic: raw.isHolographic,
      isWrittenInTestatorsHand: raw.isWrittenInTestatorsHand,
      hasTestatorSignature: raw.hasTestatorSignature,
      signatureWitnessed: raw.signatureWitnessed,
      meetsKenyanFormalities: raw.meetsKenyanFormalities,

      // Storage & Security
      storageLocation: raw.storageLocation,
      storageDetails: raw.storageDetails,
      isEncrypted: raw.isEncrypted,
      encryptionKeyId: raw.encryptionKeyId,

      // Court & Probate Information
      probateCaseNumber: raw.probateCaseNumber,
      courtRegistry: raw.courtRegistry,
      grantOfProbateIssued: raw.grantOfProbateIssued,
      grantOfProbateDate: raw.grantOfProbateDate,

      // Dependant Provision (Kenyan Law Section 26)
      hasDependantProvision: raw.hasDependantProvision,
      dependantProvisionDetails: raw.dependantProvisionDetails,
      courtApprovedProvision: raw.courtApprovedProvision,

      // Record Management
      isActiveRecord: raw.isActiveRecord,

      // Audit Trail
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,

      // Domain Relationships (Aggregates IDs)
      _assetIds: raw.assets ? raw.assets.map((asset) => asset.id) : [],
      _beneficiaryIds: raw.beneficiaries
        ? raw.beneficiaries.map((beneficiary) => beneficiary.id)
        : [],
      _witnessIds: raw.witnesses ? raw.witnesses.map((witness) => witness.id) : [],
      _executorIds: raw.executors ? raw.executors.map((executor) => executor.id) : [],
    };

    const rootWill = Will.reconstitute(rootProps);

    // Extract IDs for aggregate reconstitution (not the full entities)
    const assetIds = rootWill.assetIds;
    const beneficiaryIds = rootWill.beneficiaryIds;
    const executorIds = rootWill.executorIds;
    const witnessIds = rootWill.witnessIds;

    return WillAggregate.reconstitute(rootWill, assetIds, beneficiaryIds, executorIds, witnessIds);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(aggregate: WillAggregate): Prisma.WillUncheckedCreateInput {
    const entity = aggregate.getWill();

    // Prepare JSON objects with proper Prisma null handling
    const funeralWishesJson = entity.funeralWishes
      ? (JSON.parse(JSON.stringify(entity.funeralWishes)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const digitalAssetInstructionsJson = entity.digitalAssetInstructions
      ? (JSON.parse(JSON.stringify(entity.digitalAssetInstructions)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const legalCapacityAssessmentJson = entity.legalCapacityAssessment
      ? (JSON.parse(JSON.stringify(entity.legalCapacityAssessment)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      // Core Identity
      id: entity.id,
      title: entity.title,
      testatorId: entity.testatorId,

      // Will Classification
      type: entity.type,
      status: entity.status,

      // Legal Capacity (Section 7 Law of Succession Act)
      legalCapacityStatus: entity.legalCapacityStatus,
      legalCapacityAssessment: legalCapacityAssessmentJson,
      legalCapacityAssessedBy: entity.legalCapacityAssessedBy,
      legalCapacityAssessedAt: entity.legalCapacityAssessedAt,
      medicalCertificationId: entity.medicalCertificationId,

      // Will Dates & Versioning
      willDate: entity.willDate,
      lastModified: entity.lastModified,
      versionNumber: entity.versionNumber,
      supersedes: entity.supersedes,

      // Activation & Execution
      activatedAt: entity.activatedAt,
      activatedBy: entity.activatedBy,
      executedAt: entity.executedAt,
      executedBy: entity.executedBy,

      // Revocation (Section 16)
      isRevoked: entity.isRevoked,
      revokedAt: entity.revokedAt,
      revokedBy: entity.revokedBy,
      revocationMethod: entity.revocationMethod,
      revocationReason: entity.revocationReason,

      // Kenyan-Specific Content
      funeralWishes: funeralWishesJson,
      burialLocation: entity.burialLocation,
      cremationInstructions: entity.cremationInstructions,
      organDonation: entity.organDonation,
      organDonationDetails: entity.organDonationDetails,

      // Estate Distribution
      residuaryClause: entity.residuaryClause,
      digitalAssetInstructions: digitalAssetInstructionsJson,
      specialInstructions: entity.specialInstructions,

      // Witness Management (Kenyan Legal Requirements)
      requiresWitnesses: entity.requiresWitnesses,
      witnessCount: entity.witnessCount,
      hasAllWitnesses: entity.hasAllWitnesses,
      minimumWitnessesRequired: entity.minimumWitnessesRequired,

      // Legal Formalities (Kenyan Law Compliance)
      isHolographic: entity.isHolographic,
      isWrittenInTestatorsHand: entity.isWrittenInTestatorsHand,
      hasTestatorSignature: entity.hasTestatorSignature,
      signatureWitnessed: entity.signatureWitnessed,
      meetsKenyanFormalities: entity.meetsKenyanFormalities,

      // Storage & Security
      storageLocation: entity.storageLocation,
      storageDetails: entity.storageDetails,
      isEncrypted: entity.isEncrypted,
      encryptionKeyId: entity.encryptionKeyId,

      // Court & Probate Information
      probateCaseNumber: entity.probateCaseNumber,
      courtRegistry: entity.courtRegistry,
      grantOfProbateIssued: entity.grantOfProbateIssued,
      grantOfProbateDate: entity.grantOfProbateDate,

      // Dependant Provision (Kenyan Law Section 26)
      hasDependantProvision: entity.hasDependantProvision,
      dependantProvisionDetails: entity.dependantProvisionDetails,
      courtApprovedProvision: entity.courtApprovedProvision,

      // Record Management
      isActiveRecord: entity.isActiveRecord,

      // Audit Trail
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  /**
   * Create update-specific persistence data
   */
  static toUpdatePersistence(aggregate: WillAggregate): Prisma.WillUncheckedUpdateInput {
    const full = this.toPersistence(aggregate);

    const updatableFields: Omit<
      Prisma.WillUncheckedCreateInput,
      'id' | 'testatorId' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse funeral wishes from Prisma JSON field
   */
  private static parseFuneralWishes(funeralWishes: Prisma.JsonValue): Record<string, any> | null {
    if (!funeralWishes || typeof funeralWishes !== 'object' || Array.isArray(funeralWishes)) {
      return null;
    }
    return funeralWishes as Record<string, any>;
  }

  /**
   * Parse digital asset instructions from Prisma JSON field
   */
  private static parseDigitalAssetInstructions(
    instructions: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (!instructions || typeof instructions !== 'object' || Array.isArray(instructions)) {
      return null;
    }
    return instructions as Record<string, any>;
  }

  /**
   * Parse legal capacity assessment from Prisma JSON field
   */
  private static parseLegalCapacityAssessment(
    assessment: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
      return null;
    }
    return assessment as Record<string, any>;
  }

  /**
   * Batch domain conversion for performance
   */
  static toDomainBatch(records: WillWithRelations[]): WillAggregate[] {
    return records.map((record) => this.toDomain(record));
  }

  /**
   * Batch persistence conversion for performance
   */
  static toPersistenceBatch(aggregates: WillAggregate[]): Prisma.WillUncheckedCreateInput[] {
    return aggregates.map((aggregate) => this.toPersistence(aggregate));
  }
}
