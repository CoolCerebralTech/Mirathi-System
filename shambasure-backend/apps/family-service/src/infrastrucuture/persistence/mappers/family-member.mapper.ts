import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(FamilyMemberMapper.name);

  /**
   * Converts Prisma FamilyMember record to Domain FamilyMember aggregate
   */
  toDomain(raw: PrismaFamilyMember): FamilyMember | null {
    if (!raw) return null;

    try {
      // 1. Reconstruct KenyanName
      const name = KenyanName.create(
        raw.firstName || '',
        raw.lastName || '',
        raw.middleName || undefined,
      );

      const nameWithMaidenName = raw.maidenName ? name.withMaidenName(raw.maidenName) : name;

      // 2. Reconstruct KenyanIdentity
      let identity = KenyanIdentity.create(
        (raw.citizenship as 'KENYAN' | 'DUAL' | 'FOREIGN') || 'KENYAN',
      );

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
        // FIX: Use createStandardCertificate instead of create
        const deathCertificate = DeathCertificate.createStandardCertificate(
          raw.deathCertificateNumber,
          raw.dateOfDeath,
          raw.createdAt, // Fallback to record creation date for registration date
          raw.placeOfDeath || 'Unknown',
          'Unknown', // Registration district missing in simple DB schema
        );
        identity = identity.withDeathCertificate(deathCertificate);
      }

      // Add cultural details
      if (raw.customaryEthnicGroup || raw.religion || raw.customaryClan) {
        identity = identity.withCulturalDetails(
          raw.customaryEthnicGroup || '',
          raw.religion || '',
          raw.customaryClan || undefined,
        );
      }

      // 3. Reconstruct ContactInfo
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
          this.logger.warn(`Failed to reconstruct contact info for ${raw.id}: ${error.message}`);
        }
      }

      // 4. Reconstruct LifeStatus
      let lifeStatus: LifeStatus;
      if (raw.isDeceased && raw.dateOfDeath) {
        lifeStatus = LifeStatus.createDeceased(
          raw.dateOfDeath,
          raw.placeOfDeath || undefined,
          raw.deathCertificateNumber || undefined,
        );
      } else if (raw.missingSince) {
        lifeStatus = LifeStatus.createAlive().markMissing(
          raw.missingSince,
          raw.placeOfDeath || undefined,
        );
      } else {
        lifeStatus = LifeStatus.createAlive();
      }

      // 5. Reconstruct AgeCalculation
      let ageCalculation: AgeCalculation | undefined;
      if (raw.dateOfBirth) {
        ageCalculation = AgeCalculation.create(raw.dateOfBirth);
      }

      // 6. Reconstruct DemographicInfo
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
            raw.customaryClan || undefined,
          );
        }
      }

      // 7. Reconstruct DisabilityStatus
      let disabilityStatus: DisabilityStatus | undefined;
      if (raw.disabilityStatus && raw.disabilityStatus !== 'NONE') {
        disabilityStatus = DisabilityStatus.create(true);

        const disabilityDetail = {
          type: raw.disabilityStatus as any,
          severity: 'MODERATE' as const,
          requiresAssistance: raw.requiresSupportedDecisionMaking,
        };

        disabilityStatus = disabilityStatus.addDisability(disabilityDetail);

        if (raw.requiresSupportedDecisionMaking) {
          disabilityStatus = disabilityStatus.setSupportedDecisionMaking(true);
        }
      } else if (raw.requiresSupportedDecisionMaking) {
        disabilityStatus = DisabilityStatus.create(false);
        disabilityStatus = disabilityStatus.setSupportedDecisionMaking(true);
      }

      // 8. Reconstruct Locations
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

      // 9. Assemble Props
      const props: FamilyMemberProps = {
        id: raw.id,
        userId: raw.userId ?? undefined,
        familyId: raw.familyId,
        name: nameWithMaidenName,
        identity,
        contactInfo,
        lifeStatus,
        disabilityStatus,
        demographicInfo,
        ageCalculation,
        birthLocation,
        deathLocation,
        occupation: raw.occupation ?? undefined,
        polygamousHouseId: raw.polygamousHouseId ?? undefined,
        version: raw.version,
        lastEventId: raw.lastEventId ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt ?? undefined,
        deletedBy: raw.deletedBy ?? undefined,
        deletionReason: raw.deletionReason ?? undefined,
        isArchived: raw.isArchived,
      };

      return FamilyMember.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute FamilyMember ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for FamilyMember ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain FamilyMember aggregate to Prisma create input
   * Flattens Value Objects into scalar DB columns
   */
  toPersistenceCreate(entity: FamilyMember): Prisma.FamilyMemberUncheckedCreateInput {
    const toNullable = <T>(value: T | undefined): T | null => (value === undefined ? null : value);

    const serialized = entity.toJSON();
    // Use optional chaining carefully on serialized objects
    const identity = serialized.identity;
    const nationalId = identity?.nationalId;
    const kraPin = identity?.kraPin;
    const life = serialized.lifeStatus;
    const contact = serialized.contactInfo;
    const demo = serialized.demographicInfo;
    const age = serialized.ageCalculation;
    const disability = serialized.disabilityStatus;

    return {
      id: serialized.id,
      userId: toNullable(serialized.userId),
      familyId: serialized.familyId,
      polygamousHouseId: toNullable(serialized.polygamousHouseId),

      // Name
      firstName: serialized.name.firstName,
      lastName: serialized.name.lastName,
      middleName: toNullable(serialized.name.middleName),
      maidenName: toNullable(serialized.maidenName),

      // Identity
      // FIX: Cast unknown/any types from JSON to explicit Prisma types
      nationalId: toNullable(nationalId?.idNumber as string),
      // FIX: Access verifiedAt safely from the JSON object
      nationalIdVerified: (nationalId?.isVerified as boolean) ?? false,
      nationalIdVerifiedAt: toNullable(
        nationalId?.verifiedAt ? new Date(nationalId.verifiedAt as string) : undefined,
      ),

      kraPin: toNullable(kraPin?.pinNumber as string),
      kraPinVerified: (kraPin?.isVerified as boolean) ?? false,
      citizenship: (identity?.citizenship as string) || 'KENYAN',

      // Contact
      phoneNumber: toNullable(contact?.primaryPhone),
      email: toNullable(contact?.email),
      alternativePhone: toNullable(contact?.secondaryPhone),
      emergencyContact: contact?.emergencyContact
        ? (contact.emergencyContact as Prisma.InputJsonValue)
        : Prisma.JsonNull,

      // Life Status
      isDeceased: life.isDeceased,
      dateOfDeath: life.dateOfDeath ? new Date(life.dateOfDeath) : null,
      placeOfDeath: toNullable(life.placeOfDeath),
      presumedAlive: !life.isDeceased && !life.missingSince,
      missingSince: life.missingSince ? new Date(life.missingSince) : null,
      deathCertificateIssued: !!identity?.deathCertificate,
      deathCertificateNumber: toNullable(identity?.deathCertificate?.certificateNumber),

      // Age
      dateOfBirth: age?.dateOfBirth ? new Date(age.dateOfBirth) : null,
      ageAtDeath: toNullable(age?.ageAtDeath),
      currentAge: toNullable(age?.age),
      isMinor: age?.isMinor || false,

      // Demographics
      gender: toNullable(demo?.gender),
      placeOfBirth: toNullable(serialized.birthLocation?.placeName),
      religion: toNullable(demo?.religion || identity?.religion),
      customaryEthnicGroup: toNullable(demo?.ethnicGroup || identity?.ethnicity),
      customaryClan: toNullable(demo?.clan || identity?.clan),
      occupation: toNullable(serialized.occupation),

      // Disability
      disabilityStatus: disability?.hasDisability ? 'PHYSICAL' : 'NONE',
      requiresSupportedDecisionMaking: disability?.requiresSupportedDecisionMaking || false,
      disabilityCertificate: toNullable(disability?.disabilityCardNumber),

      // Audit & system fields — read directly from aggregate
      version: entity.version,
      lastEventId: toNullable(entity.lastEventId),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
      deletedBy: toNullable(entity.deletedBy),
      deletionReason: toNullable(entity.deletionReason),
      isArchived: entity.isArchived,
    };
  }

  /**
   * Converts Domain FamilyMember aggregate to Prisma update input
   */
  toPersistenceUpdate(entity: FamilyMember): Prisma.FamilyMemberUncheckedUpdateInput {
    // Reuse create logic since structures align for unchecked updates,
    // ensuring type compatibility by removing 'id' if necessary (though unchecked allows it as filter/match)
    const createData = this.toPersistenceCreate(entity);
    return createData as Prisma.FamilyMemberUncheckedUpdateInput;
  }

  createWhereById(id: string): Prisma.FamilyMemberWhereUniqueInput {
    return { id };
  }
}
