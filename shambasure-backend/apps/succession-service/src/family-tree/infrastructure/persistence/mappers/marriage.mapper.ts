import { KenyanCounty, Prisma, Marriage as PrismaMarriage } from '@prisma/client';

import { Marriage, MarriageReconstitutionProps } from '../../../domain/entities/marriage.entity';

export class MarriageMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaMarriage): Marriage {
    const reconstitutionProps: MarriageReconstitutionProps = {
      id: raw.id,
      familyId: raw.familyId,

      // Parties
      spouse1Id: raw.spouse1Id,
      spouse2Id: raw.spouse2Id,

      // Kenyan Marriage Certificate Details
      registrationNumber: raw.registrationNumber,
      issuingAuthority: raw.issuingAuthority,
      certificateIssueDate: raw.certificateIssueDate,
      registrationDistrict: raw.registrationDistrict,

      // Dissolution Details
      divorceType: raw.divorceType,

      // Customary Marriage Details
      bridePricePaid: raw.bridePricePaid,
      bridePriceAmount: raw.bridePriceAmount,
      bridePriceCurrency: raw.bridePriceCurrency,
      elderWitnesses: raw.elderWitnesses,
      ceremonyLocation: raw.ceremonyLocation,
      traditionalCeremonyType: raw.traditionalCeremonyType,
      lobolaReceiptNumber: raw.lobolaReceiptNumber,
      marriageElderContact: raw.marriageElderContact,
      clanApproval: raw.clanApproval,
      familyConsent: raw.familyConsent,
      traditionalRitesPerformed: raw.traditionalRitesPerformed,

      // Marriage Officer Details
      marriageOfficerName: raw.marriageOfficerName,
      marriageOfficerTitle: raw.marriageOfficerTitle,
      marriageOfficerRegistrationNumber: raw.marriageOfficerRegistrationNumber,
      marriageOfficerReligiousDenomination: raw.marriageOfficerReligiousDenomination,
      marriageOfficerLicenseNumber: raw.marriageOfficerLicenseNumber,

      // Marriage Location Details
      marriageVenue: raw.marriageVenue,
      marriageCounty: raw.marriageCounty as KenyanCounty | null, // Fixed: Type assertion
      marriageSubCounty: raw.marriageSubCounty,
      marriageDistrict: raw.marriageDistrict,
      marriageGpsCoordinates: raw.marriageGpsCoordinates,

      // Marriage details
      marriageDate: raw.marriageDate,
      marriageType: raw.marriageType,
      certificateNumber: raw.certificateNumber,

      // Dissolution
      divorceDate: raw.divorceDate,
      divorceCertNumber: raw.divorceCertNumber,

      // Status
      isActive: raw.isActive,

      // Timestamps
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Marriage.reconstitute(reconstitutionProps);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Marriage): PrismaMarriage {
    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),

      // Parties
      spouse1Id: entity.getSpouse1Id(),
      spouse2Id: entity.getSpouse2Id(),

      // Kenyan Marriage Certificate Details
      registrationNumber: entity.getRegistrationNumber(),
      issuingAuthority: entity.getIssuingAuthority(),
      certificateIssueDate: entity.getCertificateIssueDate(),
      registrationDistrict: entity.getRegistrationDistrict(),

      // Dissolution Details
      divorceType: entity.getDivorceType(),

      // Customary Marriage Details
      bridePricePaid: entity.getBridePricePaid(),
      bridePriceAmount: entity.getBridePriceAmount(),
      bridePriceCurrency: entity.getBridePriceCurrency(),
      elderWitnesses: entity.getElderWitnesses(),
      ceremonyLocation: entity.getCeremonyLocation(),
      traditionalCeremonyType: entity.getTraditionalCeremonyType(),
      lobolaReceiptNumber: entity.getLobolaReceiptNumber(),
      marriageElderContact: entity.getMarriageElderContact(),
      clanApproval: entity.getClanApproval(),
      familyConsent: entity.getFamilyConsent(),
      traditionalRitesPerformed: entity.getTraditionalRitesPerformed(),

      // Marriage Officer Details
      marriageOfficerName: entity.getMarriageOfficerName(),
      marriageOfficerTitle: entity.getMarriageOfficerTitle(),
      marriageOfficerRegistrationNumber: entity.getMarriageOfficerRegistrationNumber(),
      marriageOfficerReligiousDenomination: entity.getMarriageOfficerReligiousDenomination(),
      marriageOfficerLicenseNumber: entity.getMarriageOfficerLicenseNumber(),

      // Marriage Location Details
      marriageVenue: entity.getMarriageVenue(),
      marriageCounty: entity.getMarriageCounty(), // This should work now
      marriageSubCounty: entity.getMarriageSubCounty(),
      marriageDistrict: entity.getMarriageDistrict(),
      marriageGpsCoordinates: entity.getMarriageGpsCoordinates(),

      // Marriage details
      marriageDate: entity.getMarriageDate(),
      marriageType: entity.getMarriageType(),
      certificateNumber: entity.getCertificateNumber(),

      // Dissolution
      divorceDate: entity.getDivorceDate(),
      divorceCertNumber: entity.getDivorceCertNumber(),

      // Status
      isActive: entity.getIsActive(),

      // Timestamps
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    } as PrismaMarriage;
  }

  /**
   * Converts Domain Entity to Prisma Create input
   */
  static toPrismaCreate(entity: Marriage, familyId: string): Prisma.MarriageCreateInput {
    return {
      id: entity.getId(),
      family: {
        connect: { id: familyId },
      },

      // Parties
      spouse1: {
        connect: { id: entity.getSpouse1Id() },
      },
      spouse2: {
        connect: { id: entity.getSpouse2Id() },
      },

      // Kenyan Marriage Certificate Details
      registrationNumber: entity.getRegistrationNumber(),
      issuingAuthority: entity.getIssuingAuthority(),
      certificateIssueDate: entity.getCertificateIssueDate(),
      registrationDistrict: entity.getRegistrationDistrict(),

      // Dissolution Details
      divorceType: entity.getDivorceType(),

      // Customary Marriage Details
      bridePricePaid: entity.getBridePricePaid(),
      bridePriceAmount: entity.getBridePriceAmount(),
      bridePriceCurrency: entity.getBridePriceCurrency(),
      elderWitnesses: entity.getElderWitnesses(),
      ceremonyLocation: entity.getCeremonyLocation(),
      traditionalCeremonyType: entity.getTraditionalCeremonyType(),
      lobolaReceiptNumber: entity.getLobolaReceiptNumber(),
      marriageElderContact: entity.getMarriageElderContact(),
      clanApproval: entity.getClanApproval(),
      familyConsent: entity.getFamilyConsent(),
      traditionalRitesPerformed: entity.getTraditionalRitesPerformed(),

      // Marriage Officer Details
      marriageOfficerName: entity.getMarriageOfficerName(),
      marriageOfficerTitle: entity.getMarriageOfficerTitle(),
      marriageOfficerRegistrationNumber: entity.getMarriageOfficerRegistrationNumber(),
      marriageOfficerReligiousDenomination: entity.getMarriageOfficerReligiousDenomination(),
      marriageOfficerLicenseNumber: entity.getMarriageOfficerLicenseNumber(),

      // Marriage Location Details
      marriageVenue: entity.getMarriageVenue(),
      marriageCounty: entity.getMarriageCounty(), // This should work now
      marriageSubCounty: entity.getMarriageSubCounty(),
      marriageDistrict: entity.getMarriageDistrict(),
      marriageGpsCoordinates: entity.getMarriageGpsCoordinates(),

      // Marriage details
      marriageDate: entity.getMarriageDate(),
      marriageType: entity.getMarriageType(),
      certificateNumber: entity.getCertificateNumber(),

      // Dissolution
      divorceDate: entity.getDivorceDate(),
      divorceCertNumber: entity.getDivorceCertNumber(),

      // Status
      isActive: entity.getIsActive(),

      // Timestamps - Prisma will handle createdAt/updatedAt
    };
  }

  /**
   * Converts Domain Entity to Prisma Update input
   */
  static toPrismaUpdate(entity: Marriage): Prisma.MarriageUpdateInput {
    return {
      // Kenyan Marriage Certificate Details
      registrationNumber: entity.getRegistrationNumber(),
      issuingAuthority: entity.getIssuingAuthority(),
      certificateIssueDate: entity.getCertificateIssueDate(),
      registrationDistrict: entity.getRegistrationDistrict(),

      // Dissolution Details
      divorceType: entity.getDivorceType(),

      // Customary Marriage Details
      bridePricePaid: entity.getBridePricePaid(),
      bridePriceAmount: entity.getBridePriceAmount(),
      bridePriceCurrency: entity.getBridePriceCurrency(),
      elderWitnesses: entity.getElderWitnesses(),
      ceremonyLocation: entity.getCeremonyLocation(),
      traditionalCeremonyType: entity.getTraditionalCeremonyType(),
      lobolaReceiptNumber: entity.getLobolaReceiptNumber(),
      marriageElderContact: entity.getMarriageElderContact(),
      clanApproval: entity.getClanApproval(),
      familyConsent: entity.getFamilyConsent(),
      traditionalRitesPerformed: entity.getTraditionalRitesPerformed(),

      // Marriage Officer Details
      marriageOfficerName: entity.getMarriageOfficerName(),
      marriageOfficerTitle: entity.getMarriageOfficerTitle(),
      marriageOfficerRegistrationNumber: entity.getMarriageOfficerRegistrationNumber(),
      marriageOfficerReligiousDenomination: entity.getMarriageOfficerReligiousDenomination(),
      marriageOfficerLicenseNumber: entity.getMarriageOfficerLicenseNumber(),

      // Marriage Location Details
      marriageVenue: entity.getMarriageVenue(),
      marriageCounty: entity.getMarriageCounty(), // This should work now
      marriageSubCounty: entity.getMarriageSubCounty(),
      marriageDistrict: entity.getMarriageDistrict(),
      marriageGpsCoordinates: entity.getMarriageGpsCoordinates(),

      // Marriage details
      marriageDate: entity.getMarriageDate(),
      marriageType: entity.getMarriageType(),
      certificateNumber: entity.getCertificateNumber(),

      // Dissolution
      divorceDate: entity.getDivorceDate(),
      divorceCertNumber: entity.getDivorceCertNumber(),

      // Status
      isActive: entity.getIsActive(),

      // Timestamps
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
