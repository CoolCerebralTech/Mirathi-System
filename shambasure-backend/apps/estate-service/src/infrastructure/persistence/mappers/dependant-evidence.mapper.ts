// src/estate-service/src/infrastructure/persistence/prisma/mappers/dependant-evidence.mapper.ts
import { Injectable } from '@nestjs/common';
import { DependantEvidence as PrismaDependantEvidence } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { DependantEvidence } from '../../../domain/entities/dependant-evidence.entity';
import { EvidenceType } from '../../../domain/enums/evidence-type.enum';

@Injectable()
export class DependantEvidenceMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaEvidence: PrismaDependantEvidence): DependantEvidence {
    if (!prismaEvidence) return null;

    const {
      id,
      dependantId,
      type,
      documentUrl,
      description,
      isVerified,
      verifiedBy,
      verifiedAt,
      uploadedBy,
      uploadedAt,
      expiresAt,
      isExpired,
      validationNotes,
      validationScore,
    } = prismaEvidence;

    // Map EvidenceType
    const evidenceType = this.mapToDomainEvidenceType(type);

    const evidenceProps = {
      dependantId,
      type: evidenceType,
      documentUrl,
      description,
      isVerified,
      verifiedBy: verifiedBy || undefined,
      verifiedAt: verifiedAt || undefined,
      uploadedBy,
      uploadedAt,
      expiresAt: expiresAt || undefined,
      isExpired,
      validationNotes: validationNotes || undefined,
      validationScore,
    };

    return DependantEvidence.create(evidenceProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(evidence: DependantEvidence): Partial<PrismaDependantEvidence> {
    const props = evidence.getProps();

    return {
      id: evidence.id.toString(),
      dependantId: props.dependantId,
      type: this.mapToPrismaEvidenceType(props.type),
      documentUrl: props.documentUrl,
      description: props.description,
      isVerified: props.isVerified,
      verifiedBy: props.verifiedBy || null,
      verifiedAt: props.verifiedAt || null,
      uploadedBy: props.uploadedBy,
      uploadedAt: props.uploadedAt,
      expiresAt: props.expiresAt || null,
      isExpired: props.isExpired,
      validationNotes: props.validationNotes || null,
      validationScore: props.validationScore,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaEvidences: PrismaDependantEvidence[]): DependantEvidence[] {
    return prismaEvidences
      .map((evidence) => this.toDomain(evidence))
      .filter((evidence) => evidence !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(evidences: DependantEvidence[]): Partial<PrismaDependantEvidence>[] {
    return evidences.map((evidence) => this.toPersistence(evidence));
  }

  /**
   * Map Prisma evidence type to Domain enum
   */
  private mapToDomainEvidenceType(prismaType: string): EvidenceType {
    switch (prismaType) {
      case 'MARRIAGE_CERTIFICATE':
        return EvidenceType.MARRIAGE_CERTIFICATE;
      case 'BIRTH_CERTIFICATE':
        return EvidenceType.BIRTH_CERTIFICATE;
      case 'AFFIDAVIT':
        return EvidenceType.AFFIDAVIT;
      case 'COURT_ORDER':
        return EvidenceType.COURT_ORDER;
      case 'MEDICAL_REPORT':
        return EvidenceType.MEDICAL_REPORT;
      case 'OTHER':
        return EvidenceType.OTHER;
      default:
        throw new Error(`Unknown evidence type: ${prismaType}`);
    }
  }

  /**
   * Map Domain evidence type to Prisma enum
   */
  private mapToPrismaEvidenceType(domainType: EvidenceType): string {
    switch (domainType) {
      case EvidenceType.MARRIAGE_CERTIFICATE:
        return 'MARRIAGE_CERTIFICATE';
      case EvidenceType.BIRTH_CERTIFICATE:
        return 'BIRTH_CERTIFICATE';
      case EvidenceType.AFFIDAVIT:
        return 'AFFIDAVIT';
      case EvidenceType.COURT_ORDER:
        return 'COURT_ORDER';
      case EvidenceType.MEDICAL_REPORT:
        return 'MEDICAL_REPORT';
      case EvidenceType.OTHER:
        return 'OTHER';
      default:
        throw new Error(`Unknown evidence type: ${domainType}`);
    }
  }

  /**
   * Get evidence statistics
   */
  getEvidenceStatistics(evidences: DependantEvidence[]): {
    totalCount: number;
    verifiedCount: number;
    expiredCount: number;
    byType: Record<string, number>;
    averageValidationScore: number;
    validEvidence: DependantEvidence[];
    invalidEvidence: DependantEvidence[];
  } {
    const validEvidence = evidences.filter((evidence) => evidence.isValid());
    const invalidEvidence = evidences.filter((evidence) => !evidence.isValid());
    const expiredCount = evidences.filter((evidence) => evidence.isExpired).length;

    // Count by type
    const byType = evidences.reduce(
      (acc, evidence) => {
        const type = evidence.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate average validation score
    const totalScore = evidences.reduce((sum, evidence) => sum + evidence.validationScore, 0);
    const averageValidationScore = evidences.length > 0 ? totalScore / evidences.length : 0;

    return {
      totalCount: evidences.length,
      verifiedCount: evidences.filter((e) => e.isVerified).length,
      expiredCount,
      byType,
      averageValidationScore,
      validEvidence,
      invalidEvidence,
    };
  }

  /**
   * Filter evidence by type
   */
  filterByType(evidences: DependantEvidence[], type: EvidenceType): DependantEvidence[] {
    return evidences.filter((evidence) => evidence.type === type);
  }

  /**
   * Filter valid evidence (verified and not expired)
   */
  filterValidEvidence(evidences: DependantEvidence[]): DependantEvidence[] {
    return evidences.filter((evidence) => evidence.isValid());
  }

  /**
   * Filter evidence requiring verification
   */
  filterRequiringVerification(evidences: DependantEvidence[]): DependantEvidence[] {
    return evidences.filter((evidence) => evidence.requiresReverification());
  }

  /**
   * Check if evidence collection is sufficient for a dependant claim
   */
  isSufficientForClaim(
    evidences: DependantEvidence[],
    claimType: string,
  ): {
    isSufficient: boolean;
    missingTypes: EvidenceType[];
    overallCredibility: number;
  } {
    const validEvidences = this.filterValidEvidence(evidences);
    const requiredTypes = this.getRequiredEvidenceTypes(claimType);
    const presentTypes = new Set(validEvidences.map((e) => e.type));

    const missingTypes = requiredTypes.filter((type) => !presentTypes.has(type));

    // Calculate overall credibility
    const totalScore = validEvidences.reduce((sum, evidence) => sum + evidence.validationScore, 0);
    const overallCredibility = validEvidences.length > 0 ? totalScore / validEvidences.length : 0;

    return {
      isSufficient: missingTypes.length === 0,
      missingTypes,
      overallCredibility,
    };
  }

  /**
   * Get required evidence types based on claim type
   */
  private getRequiredEvidenceTypes(claimType: string): EvidenceType[] {
    const requirements: Record<string, EvidenceType[]> = {
      SPOUSE: [EvidenceType.MARRIAGE_CERTIFICATE],
      CHILD: [EvidenceType.BIRTH_CERTIFICATE],
      ADOPTED_CHILD: [EvidenceType.BIRTH_CERTIFICATE, EvidenceType.COURT_ORDER],
      DISABILITY: [EvidenceType.MEDICAL_REPORT],
      MAINTENANCE: [EvidenceType.AFFIDAVIT, EvidenceType.OTHER],
    };

    return requirements[claimType] || [EvidenceType.OTHER];
  }

  /**
   * Prepare evidence for court submission
   */
  prepareCourtSubmission(evidences: DependantEvidence[]): Array<{
    type: string;
    description: string;
    documentUrl: string;
    verified: boolean;
    validationScore: number;
    uploadedDate: Date;
  }> {
    const validEvidences = this.filterValidEvidence(evidences);

    return validEvidences.map((evidence) => {
      const props = evidence.getProps();
      return {
        type: props.type,
        description: props.description,
        documentUrl: props.documentUrl,
        verified: props.isVerified,
        validationScore: props.validationScore,
        uploadedDate: props.uploadedAt,
      };
    });
  }

  /**
   * Update evidence verification status
   */
  updateVerificationStatus(
    evidence: DependantEvidence,
    isVerified: boolean,
    verifiedBy?: string,
    validationNotes?: string,
  ): Partial<PrismaDependantEvidence> {
    const updates: Partial<PrismaDependantEvidence> = {
      isVerified,
      validationNotes: validationNotes || null,
    };

    if (isVerified) {
      updates.verifiedBy = verifiedBy || null;
      updates.verifiedAt = new Date();
      updates.validationScore = Math.min(100, evidence.validationScore + 20); // Boost for verification
    } else {
      updates.verifiedBy = null;
      updates.verifiedAt = null;
      updates.validationScore = Math.max(0, evidence.validationScore - 10); // Penalty for unverification
    }

    return updates;
  }

  /**
   * Create initial evidence for different claim types
   */
  createInitialEvidence(
    dependantId: string,
    claimType: string,
    evidenceData: {
      documentUrl: string;
      description: string;
      uploadedBy: string;
      additionalInfo?: Record<string, any>;
    },
  ): Partial<PrismaDependantEvidence> {
    const evidenceType = this.determineEvidenceType(claimType, evidenceData.additionalInfo);

    return {
      id: new UniqueEntityID().toString(),
      dependantId,
      type: this.mapToPrismaEvidenceType(evidenceType),
      documentUrl: evidenceData.documentUrl,
      description: evidenceData.description,
      isVerified: false,
      uploadedBy: evidenceData.uploadedBy,
      uploadedAt: new Date(),
      validationScore: this.getBaseCredibilityScore(evidenceType),
    };
  }

  /**
   * Determine evidence type based on claim type
   */
  private determineEvidenceType(
    claimType: string,
    additionalInfo?: Record<string, any>,
  ): EvidenceType {
    switch (claimType) {
      case 'SPOUSE':
        return additionalInfo?.marriageDate
          ? EvidenceType.MARRIAGE_CERTIFICATE
          : EvidenceType.AFFIDAVIT;
      case 'CHILD':
        return additionalInfo?.dateOfBirth
          ? EvidenceType.BIRTH_CERTIFICATE
          : EvidenceType.AFFIDAVIT;
      case 'DISABILITY':
        return EvidenceType.MEDICAL_REPORT;
      case 'MAINTENANCE':
        return EvidenceType.OTHER;
      default:
        return EvidenceType.OTHER;
    }
  }

  /**
   * Get base credibility score for evidence type
   */
  private getBaseCredibilityScore(type: EvidenceType): number {
    const scores: Record<EvidenceType, number> = {
      [EvidenceType.MARRIAGE_CERTIFICATE]: 90,
      [EvidenceType.BIRTH_CERTIFICATE]: 95,
      [EvidenceType.COURT_ORDER]: 100,
      [EvidenceType.MEDICAL_REPORT]: 85,
      [EvidenceType.AFFIDAVIT]: 70,
      [EvidenceType.OTHER]: 60,
    };

    return scores[type] || 50;
  }
}
