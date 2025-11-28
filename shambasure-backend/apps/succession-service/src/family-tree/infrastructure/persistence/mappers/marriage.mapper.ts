import { Marriage as PrismaMarriage } from '@prisma/client';
import { Marriage, CustomaryMarriageDetails } from '../../../domain/entities/marriage.entity';

/**
 * MarriageMapper
 *
 * Transforms the Marriage Aggregate Root between Domain and Persistence layers.
 * Handles complex JSON structures for Customary Marriage details.
 */
export class MarriageMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaMarriage): Marriage {
    // 1. Construct Customary Details
    // Assuming the schema has been updated to include 'customaryDetails' JSON column
    // or we are temporarily mapping it from 'certificateNumber' if used loosely (bad practice)
    // or defaulting it.
    //
    // CHECKING SCHEMA: Marriage table has:
    // id, familyId, spouse1Id, spouse2Id, marriageDate, marriageType, certificateNumber,
    // divorceDate, divorceCertNumber, isActive.
    // It DOES NOT have 'customaryDetails', 'marriageOfficer', 'location'.

    // Defaulting missing schema fields:
    const customaryDetails: CustomaryMarriageDetails | null = null;

    return Marriage.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      spouse1Id: raw.spouse1Id,
      spouse2Id: raw.spouse2Id,

      marriageDate: raw.marriageDate,
      marriageType: raw.marriageType,
      certificateNumber: raw.certificateNumber,

      divorceDate: raw.divorceDate,
      divorceCertNumber: raw.divorceCertNumber,

      isActive: raw.isActive,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,

      // Fields not in schema yet:
      customaryMarriageDetails: customaryDetails,
      marriageRegistrationNumber: null,
      marriageOfficer: null,
      marriageLocation: null,
    });
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Marriage): PrismaMarriage {
    // We map only what is available in the current Prisma Schema.
    // Ideally, Customary Details should be stored in a JSON column.

    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),
      spouse1Id: entity.getSpouse1Id(),
      spouse2Id: entity.getSpouse2Id(),

      marriageDate: entity.getMarriageDate(),
      marriageType: entity.getMarriageType(),
      certificateNumber: entity.getCertificateNumber() || null,

      divorceDate: entity.getDivorceDate(),
      divorceCertNumber: entity.getDivorceCertNumber() || null,

      isActive: entity.getIsActive(),

      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
