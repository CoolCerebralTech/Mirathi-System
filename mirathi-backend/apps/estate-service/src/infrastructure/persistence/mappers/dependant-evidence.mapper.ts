// src/estate-service/src/infrastructure/persistence/mappers/dependant-evidence.mapper.ts
import { Injectable } from '@nestjs/common';
import { DependantEvidence as PrismaDependantEvidence } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { DependantEvidence } from '../../../domain/entities/dependant-evidence.entity';
import { EvidenceType } from '../../../domain/enums/evidence-type.enum';

@Injectable()
export class DependantEvidenceMapper {
  toDomain(prismaEvidence: PrismaDependantEvidence): DependantEvidence {
    if (!prismaEvidence) throw new Error('Cannot map null Prisma object');

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

    // Use internal constructor logic via generic create or create specific factory if props match
    return DependantEvidence.create(evidenceProps, new UniqueEntityID(id));
  }

  toPersistence(evidence: DependantEvidence): any {
    // USE PUBLIC GETTERS

    return {
      id: evidence.id.toString(),
      dependantId: evidence.dependantId,
      type: this.mapToPrismaEvidenceType(evidence.type) as any, // Cast for Prisma Enum
      documentUrl: evidence.documentUrl,
      description: evidence.description,
      isVerified: evidence.isVerified,
      verifiedBy: evidence.verifiedBy || null,
      verifiedAt: evidence.verifiedAt || null,
      uploadedBy: evidence.uploadedBy,
      uploadedAt: evidence.uploadedAt,
      expiresAt: evidence.expiresAt || null,
      isExpired: evidence.isExpired,
      validationNotes: evidence.validationNotes || null,
      validationScore: evidence.validationScore,
    };
  }

  toDomainList(prismaEvidences: PrismaDependantEvidence[]): DependantEvidence[] {
    if (!prismaEvidences) return [];
    return prismaEvidences
      .map((evidence) => {
        try {
          return this.toDomain(evidence);
        } catch {
          return null;
        }
      })
      .filter((evidence): evidence is DependantEvidence => evidence !== null);
  }

  toPersistenceList(evidences: DependantEvidence[]): any[] {
    return evidences.map((evidence) => this.toPersistence(evidence));
  }

  private mapToDomainEvidenceType(prismaType: string): EvidenceType {
    // Map DB Enum to Domain Enum
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
        return EvidenceType.OTHER;
    }
  }

  private mapToPrismaEvidenceType(domainType: EvidenceType): string {
    // Map Domain Enum (Rich) to DB Enum (Limited)
    switch (domainType) {
      // 1-to-1 Matches
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

      // Mappings
      case EvidenceType.DEATH_CERTIFICATE:
        return 'OTHER';
      case EvidenceType.NATIONAL_ID:
        return 'OTHER';
      case EvidenceType.PASSPORT:
        return 'OTHER';
      case EvidenceType.DIVORCE_DECREE:
        return 'COURT_ORDER';
      case EvidenceType.ADOPTION_CERTIFICATE:
        return 'COURT_ORDER'; // Often court-issued
      case EvidenceType.DNA_TEST_RESULT:
        return 'MEDICAL_REPORT';
      case EvidenceType.BANK_STATEMENTS:
        return 'OTHER';
      case EvidenceType.PAYSLIPS:
        return 'OTHER';
      case EvidenceType.MONEY_TRANSFER_RECEIPTS:
        return 'OTHER';
      case EvidenceType.SCHOOL_FEE_RECEIPTS:
        return 'OTHER';
      case EvidenceType.MEDICAL_BILLS:
        return 'OTHER';
      case EvidenceType.DISABILITY_CERTIFICATE:
        return 'MEDICAL_REPORT';
      case EvidenceType.DOCTORS_AFFIDAVIT:
        return 'AFFIDAVIT';
      case EvidenceType.PHOTOGRAPHS:
        return 'OTHER';
      case EvidenceType.LETTERS_CORRESPONDENCE:
        return 'OTHER';
      case EvidenceType.WITNESS_STATEMENT:
        return 'AFFIDAVIT';

      default:
        return 'OTHER';
    }
  }

  // ... (getEvidenceStatistics, etc. logic remains same but using getters) ...
}
