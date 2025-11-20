import { Marriage as PrismaMarriage } from '@prisma/client';
import { Marriage } from '../../../domain/entities/marriage.entity';

export class MarriageMapper {
  /**
   * Domain -> Database
   */
  static toPersistence(domain: Marriage): PrismaMarriage {
    return {
      id: domain.getId(),
      familyId: domain.getFamilyId(),

      spouse1Id: domain.getSpouse1Id(),
      spouse2Id: domain.getSpouse2Id(),

      marriageDate: domain.getDate(),
      marriageType: domain.getType(),
      certificateNumber: domain.getCertificateNumber() || null,

      // Dissolution
      divorceDate: (domain as any).divorceDate || null, // Accessing internal private field via cast or getter if available
      divorceCertNumber: (domain as any).divorceCertNumber || null,

      isActive: domain.getIsActive(),

      createdAt: new Date(), // Managed by DB
      updatedAt: new Date(),
    } as unknown as PrismaMarriage;
  }

  /**
   * Database -> Domain
   */
  static toDomain(raw: PrismaMarriage): Marriage {
    return Marriage.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      spouse1Id: raw.spouse1Id,
      spouse2Id: raw.spouse2Id,
      marriageType: raw.marriageType,
      marriageDate: raw.marriageDate,

      certificateNumber: raw.certificateNumber,
      divorceDate: raw.divorceDate,
      divorceCertNumber: raw.divorceCertNumber,

      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
