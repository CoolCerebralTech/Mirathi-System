// family-member.mapper.ts
import { Injectable } from '@nestjs/common';
import { Prisma, FamilyMember as PrismaFamilyMember } from '@prisma/client';

import { FamilyMember, FamilyMemberProps } from '../../../domain/entities/family-member.entity';
import { KenyanLocation } from '../../../domain/value-objects/geographical/kenyan-location.vo';
import { DeathCertificate } from '../../../domain/value-objects/identity/death-certificate.vo';
import { KenyanIdentity } from '../../../domain/value-objects/identity/kenyan-identity.vo';
import { KraPin } from '../../../domain/value-objects/identity/kra-pin.vo';
import { NationalId } from '../../../domain/value-objects/identity/national-id.vo';
import { AgeCalculation } from '../../../domain/value-objects/personal/age-calculation.vo';
import { ContactInfo } from '../../../domain/value-objects/personal/contact-info.vo';
import { DemographicInfo } from '../../../domain/value-objects/personal/demographic-info.vo';
import { DisabilityStatus } from '../../../domain/value-objects/personal/disability-status.vo';
import { KenyanName } from '../../../domain/value-objects/personal/kenyan-name.vo';
import { LifeStatus } from '../../../domain/value-objects/personal/life-status.vo';

@Injectable()
export class FamilyMemberMapper {
  /**
   * Converts Prisma FamilyMember record to Domain FamilyMember aggregate
   */
  toDomain(raw: PrismaFamilyMember): FamilyMember {
    // Convert null to undefined for domain
    const toUndefined = <T>(value: T | null): T | undefined => (value === null ? undefined : value);

    try {
      // Reconstruct KenyanName
      const name = KenyanName.create(
        raw.firstName || '',
        raw.lastName || '',
        toUndefined(raw.middleName),
      );

      const nameWithMaidenName = raw.maidenName ? name.withMaidenName(raw.maidenName) : name;

      // Reconstruct KenyanIdentity
      let identity = KenyanIdentity.create((raw.citizenship as any) || 'KENYAN');

      // Add National ID
      if (raw.nationalId) {
        const nationalId = raw.nationalIdVerified
          ? NationalId.createVerified(
              raw.nationalId,
              'DATABASE_RECONSTITUTION',
              raw.nationalIdVerifiedAt?.toISOString() || 'auto',
            )
          : NationalId.createUnverified(raw.nationalId);
        identity = identity.withNationalId(nationalId);
      }

      // Add KRA PIN
      if (raw.kraPin) {
        const kraPin = raw.kraPinVerified
          ? KraPin.createVerified(raw.kraPin, 'DATABASE_RECONSTITUTION', true)
          : KraPin.create(raw.kraPin);
        identity = identity.withKraPin(kraPin);
      }

      // Add death certificate
      if (raw.deathCertificateNumber && raw.dateOfDeath) {
        const deathCertificate = DeathCertificate.create(
          raw.deathCertificateNumber,
          raw.dateOfDeath,
          new Date(),
          raw.placeOfDeath || '',
        );
        identity = identity.withDeathCertificate(deathCertificate);
      }

      // Add cultural details
      if (raw.customaryEthnicGroup || raw.religion || raw.customaryClan) {
        identity = identity.withCulturalDetails(
          raw.customaryEthnicGroup || '',
          raw.religion || '',
          toUndefined(raw.customaryClan),
        );
      }

      // Reconstruct ContactInfo
      let contactInfo: ContactInfo | undefined;
      if (raw.phoneNumber) {
        try {
          contactInfo = ContactInfo.create(raw.phoneNumber, '');
          if (raw.email) {
            contactInfo = contactInfo.updateEmail(raw.email);
          }
          if (raw.alternativePhone) {
            contactInfo = contactInfo.updateSecondaryPhone(raw.alternativePhone);
          }
        } catch (error) {
          console.warn('Failed to reconstruct contact info:', error);
        }
      }

      // Reconstruct LifeStatus
      let lifeStatus: LifeStatus;
      if (raw.isDeceased && raw.dateOfDeath) {
        lifeStatus = LifeStatus.createDeceased(
          raw.dateOfDeath,
          toUndefined(raw.placeOfDeath),
          toUndefined(raw.deathCertificateNumber),
        );
      } else if (raw.missingSince) {
        lifeStatus = LifeStatus.createAlive().markMissing(
          raw.missingSince,
          toUndefined(raw.placeOfDeath),
        );
      } else {
        lifeStatus = LifeStatus.createAlive();
      }

      // Reconstruct AgeCalculation
      let ageCalculation: AgeCalculation | undefined;
      if (raw.dateOfBirth) {
        ageCalculation = AgeCalculation.create(raw.dateOfBirth);
      }

      // Reconstruct DemographicInfo
      let demographicInfo: DemographicInfo | undefined;
      if (raw.gender || raw.religion || raw.customaryEthnicGroup) {
        demographicInfo = DemographicInfo.create();
        if (raw.gender) {
          demographicInfo = demographicInfo.updateGender(raw.gender as any);
        }
        if (raw.religion) {
          demographicInfo = demographicInfo.updateReligion(raw.religion as any);
        }
        if (raw.customaryEthnicGroup) {
          demographicInfo = demographicInfo.updateEthnicity(
            raw.customaryEthnicGroup,
            toUndefined(raw.customaryClan),
          );
        }
      }

      // Reconstruct DisabilityStatus
      let disabilityStatus: DisabilityStatus | undefined;
      if (raw.disabilityStatus && raw.disabilityStatus !== 'NONE') {
        disabilityStatus = DisabilityStatus.create(true);

        // Add disability details based on status
        const disabilityDetail = {
          type: raw.disabilityStatus as any,
          severity: 'MODERATE' as const,
          requiresAssistance: raw.requiresSupportedDecisionMaking || false,
        };

        disabilityStatus = disabilityStatus.addDisability(disabilityDetail);

        if (raw.requiresSupportedDecisionMaking) {
          disabilityStatus = disabilityStatus.setSupportedDecisionMaking(true);
        }
      } else if (raw.requiresSupportedDecisionMaking) {
        disabilityStatus = DisabilityStatus.create(false);
        disabilityStatus = disabilityStatus.setSupportedDecisionMaking(true);
      }

      // Reconstruct locations
      let birthLocation: KenyanLocation | undefined;
      if (raw.placeOfBirth) {
        birthLocation = KenyanLocation.createFromProps({
          county: 'UNKNOWN' as any,
          placeName: raw.placeOfBirth,
          isUrban: false,
          isRural: true,
        });
      }

      let deathLocation: KenyanLocation | undefined;
      if (raw.placeOfDeath) {
        deathLocation = KenyanLocation.createFromProps({
          county: 'UNKNOWN' as any,
          placeName: raw.placeOfDeath,
          isUrban: false,
          isRural: true,
        });
      }

      // Assemble props
      const props: FamilyMemberProps = {
        id: raw.id,
        userId: toUndefined(raw.userId),
        familyId: raw.familyId,
        name: nameWithMaidenName,
        identity,
        contactInfo,
        lifeStatus,
        disabilityStatus: disabilityStatus,
        demographicInfo,
        ageCalculation,
        birthLocation,
        deathLocation,
        occupation: toUndefined(raw.occupation),
        polygamousHouseId: toUndefined(raw.polygamousHouseId),
        version: raw.version,
        lastEventId: toUndefined(raw.lastEventId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: toUndefined(raw.deletedAt),
        deletedBy: toUndefined(raw.deletedBy),
        deletionReason: toUndefined(raw.deletionReason),
        isArchived: raw.isArchived,
      };

      return FamilyMember.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting FamilyMember from persistence:', error);
      throw new Error(`Failed to reconstitute FamilyMember ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain FamilyMember aggregate to Prisma create input
   */
  toPersistenceCreate(entity: FamilyMember): Prisma.FamilyMemberUncheckedCreateInput {
    // Helper to convert undefined to null for Prisma
    const toNullable = <T>(value: T | undefined): T | null => (value === undefined ? null : value);

    // Helper to convert emergency contact
    const toEmergencyContact = (
      emergencyContact: any,
    ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue => {
      if (!emergencyContact) {
        return Prisma.JsonNull;
      }
      return emergencyContact as Prisma.InputJsonValue;
    };

    // Extract values from domain entity
    const emergencyContact = entity.contactInfo?.emergencyContact;
    const identity = entity.identity;
    const lifeStatus = entity.lifeStatus.toJSON();
    const ageCalculation = entity.ageCalculation?.toJSON();
    const demographicInfo = entity.demographicInfo?.toJSON();
    const disabilityStatus = entity.disabilityStatus?.toJSON();

    return {
      id: entity.id,
      userId: toNullable(entity.userId),
      familyId: entity.familyId,
      polygamousHouseId: toNullable(entity.polygamousHouseId),

      // Name
      firstName: entity.name.firstName,
      lastName: entity.name.lastName,
      middleName: toNullable(entity.name.middleName),
      maidenName: toNullable(entity.maidenName),

      // Identity
      nationalId: toNullable(identity.nationalId?.idNumber),
      nationalIdVerified: (identity.nationalId?.isVerified as boolean) || false,
      nationalIdVerifiedAt: toNullable(identity.nationalId?.verifiedAt),
      kraPin: toNullable(identity.kraPin?.pinNumber),
      kraPinVerified: (identity.kraPin?.isVerified as boolean) || false,
      citizenship: identity.citizenship || 'KENYAN',

      // Contact
      phoneNumber: toNullable(entity.contactInfo?.primaryPhone),
      email: toNullable(entity.contactInfo?.email),
      alternativePhone: toNullable(entity.contactInfo?.secondaryPhone),
      emergencyContact: toEmergencyContact(emergencyContact),

      // Life Status
      isDeceased: lifeStatus.isDeceased,
      dateOfDeath: toNullable(lifeStatus.dateOfDeath),
      placeOfDeath: toNullable(lifeStatus.placeOfDeath),
      presumedAlive: lifeStatus.isAlive,
      missingSince: toNullable(lifeStatus.missingSince),
      deathCertificateIssued: !!identity.deathCertificate,
      deathCertificateNumber: toNullable(identity.deathCertificate?.certificateNumber),

      // Age
      dateOfBirth: toNullable(ageCalculation?.dateOfBirth),
      ageAtDeath: toNullable(ageCalculation?.ageAtDeath),
      currentAge: toNullable(ageCalculation?.age),
      isMinor: ageCalculation?.isMinor || false,

      // Demographics
      gender: toNullable(demographicInfo?.gender),
      placeOfBirth: toNullable(entity.birthLocation?.placeName),
      religion: toNullable(demographicInfo?.religion || identity.religion),
      customaryEthnicGroup: toNullable(demographicInfo?.ethnicGroup || identity.ethnicity),
      customaryClan: toNullable(demographicInfo?.clan || identity.clan),
      occupation: toNullable(entity.occupation),

      // Disability
      disabilityStatus: toNullable(disabilityStatus?.status || 'NONE'),
      requiresSupportedDecisionMaking: disabilityStatus?.requiresSupportedDecisionMaking || false,
      disabilityCertificate: toNullable(disabilityStatus?.disabilityCardNumber),

      // Versioning & Audit
      version: entity.version,
      lastEventId: toNullable(entity.lastEventId),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: toNullable(entity.deletedAt),
      deletedBy: toNullable(entity.deletedBy),
      deletionReason: toNullable(entity.deletionReason),
      isArchived: entity.isArchived,
    };
  }

  /**
   * Converts Domain FamilyMember aggregate to Prisma update input
   * Only includes changed fields
   */
  toPersistenceUpdate(entity: FamilyMember): Prisma.FamilyMemberUncheckedUpdateInput {
    // For updates, we only need to update certain fields
    // Use the same helpers as above
    const toNullable = <T>(value: T | undefined): T | null => (value === undefined ? null : value);

    const toEmergencyContact = (
      emergencyContact: any,
    ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue => {
      if (!emergencyContact) {
        return Prisma.JsonNull;
      }
      return emergencyContact as Prisma.InputJsonValue;
    };

    const identity = entity.identity.toJSON();
    const lifeStatus = entity.lifeStatus.toJSON();
    const ageCalculation = entity.ageCalculation?.toJSON();
    const demographicInfo = entity.demographicInfo?.toJSON();
    const disabilityStatus = entity.disabilityStatus?.toJSON();
    const emergencyContact = entity.contactInfo?.emergencyContact;

    return {
      // Name
      firstName: entity.name.firstName,
      lastName: entity.name.lastName,
      middleName: toNullable(entity.name.middleName),
      maidenName: toNullable(entity.maidenName),

      // Identity
      nationalId: toNullable(identity.nationalId?.idNumber),
      nationalIdVerified: identity.nationalId?.isVerified ?? false,
      nationalIdVerifiedAt: toNullable(identity.nationalId?.verifiedAt),

      kraPin: toNullable(identity.kraPin?.pinNumber),
      kraPinVerified: identity.kraPin?.isVerified ?? false,

      citizenship: identity.citizenship ?? 'KENYAN',

      // Contact
      phoneNumber: toNullable(entity.contactInfo?.primaryPhone),
      email: toNullable(entity.contactInfo?.email),
      alternativePhone: toNullable(entity.contactInfo?.secondaryPhone),
      emergencyContact: toEmergencyContact(emergencyContact),

      // Life Status
      isDeceased: lifeStatus.isDeceased,
      dateOfDeath: toNullable(lifeStatus.dateOfDeath),
      placeOfDeath: toNullable(lifeStatus.placeOfDeath),
      presumedAlive: lifeStatus.isAlive,
      missingSince: toNullable(lifeStatus.missingSince),
      deathCertificateIssued: !!identity.deathCertificate,
      deathCertificateNumber: toNullable(identity.deathCertificate?.certificateNumber),

      // Age
      dateOfBirth: toNullable(ageCalculation?.dateOfBirth),
      ageAtDeath: toNullable(ageCalculation?.ageAtDeath),
      currentAge: toNullable(ageCalculation?.age),
      isMinor: ageCalculation?.isMinor || false,

      // Demographics
      gender: toNullable(demographicInfo?.gender),
      placeOfBirth: toNullable(entity.birthLocation?.placeName),
      religion: toNullable(demographicInfo?.religion || identity.religion),
      customaryEthnicGroup: toNullable(demographicInfo?.ethnicGroup || identity.ethnicity),
      customaryClan: toNullable(demographicInfo?.clan || identity.clan),
      occupation: toNullable(entity.occupation),

      // Disability
      disabilityStatus: toNullable(disabilityStatus?.status || 'NONE'),
      requiresSupportedDecisionMaking: disabilityStatus?.requiresSupportedDecisionMaking || false,
      disabilityCertificate: toNullable(disabilityStatus?.disabilityCardNumber),

      // Versioning & Audit
      version: entity.version,
      lastEventId: toNullable(entity.lastEventId),
      updatedAt: entity.updatedAt,
      deletedAt: toNullable(entity.deletedAt),
      deletedBy: toNullable(entity.deletedBy),
      deletionReason: toNullable(entity.deletionReason),
      isArchived: entity.isArchived,
    };
  }

  /**
   * Creates a Prisma where clause for the FamilyMember by ID
   */
  createWhereById(id: string): Prisma.FamilyMemberWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.FamilyMemberInclude {
    return {
      // Add relationships as needed
      // family: true,
      // polygamousHouse: true,
      // marriagesAsSpouse1: true,
      // marriagesAsSpouse2: true,
    };
  }
}
