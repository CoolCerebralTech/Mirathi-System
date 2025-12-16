// family-member.mapper.ts
import { Injectable } from '@nestjs/common';
import { KenyanCounty, Prisma, FamilyMember as PrismaFamilyMember, UserRole } from '@prisma/client';

import { FamilyMember, FamilyMemberProps } from '../../../domain/entities/family-member.entity';
import {
  KenyanLocation,
  KenyanLocationProps,
} from '../../../domain/value-objects/geographical/kenyan-location.vo';
import { BirthCertificate } from '../../../domain/value-objects/identity/birth-certificate.vo';
import { DeathCertificate } from '../../../domain/value-objects/identity/death-certificate.vo';
import {
  KenyanIdentity,
  KenyanIdentityProps,
} from '../../../domain/value-objects/identity/kenyan-identity.vo';
import { KraPin } from '../../../domain/value-objects/identity/kra-pin.vo';
import { NationalId } from '../../../domain/value-objects/identity/national-id.vo';
import { AgeCalculation } from '../../../domain/value-objects/personal/age-calculator.vo';
import {
  ContactInfo,
  ContactInfoProps,
} from '../../../domain/value-objects/personal/contact-info.vo';
import {
  DemographicInfo,
  DemographicInfoProps,
} from '../../../domain/value-objects/personal/demographic-info.vo';
import {
  DisabilityStatus,
  DisabilityStatusProps,
} from '../../../domain/value-objects/personal/disability-status.vo';
import { KenyanName, KenyanNameProps } from '../../../domain/value-objects/personal/kenyan-name.vo';
import { LifeStatus, LifeStatusProps } from '../../../domain/value-objects/personal/life-status.vo';

@Injectable()
export class FamilyMemberMapper {
  /**
   * Converts Prisma FamilyMember record to Domain FamilyMember aggregate
   * Handles complex Value Object reconstruction
   */
  toDomain(raw: PrismaFamilyMember | null): FamilyMember | null {
    if (!raw) return null;

    try {
      // 1. Reconstitute KenyanName Value Object
      const name = this.reconstituteKenyanName(raw);

      // 2. Reconstitute KenyanIdentity Value Object
      const identity = this.reconstituteKenyanIdentity(raw);

      // 3. Reconstitute ContactInfo Value Object
      const contactInfo = this.reconstituteContactInfo(raw);

      // 4. Reconstitute LifeStatus Value Object
      const lifeStatus = this.reconstituteLifeStatus(raw);

      // 5. Reconstitute AgeCalculation Value Object
      const ageCalculation = this.reconstituteAgeCalculation(raw);

      // 6. Reconstitute DemographicInfo Value Object
      const demographicInfo = this.reconstituteDemographicInfo(raw);

      // 7. Reconstitute DisabilityStatus Value Object
      const disabilityStatus = this.reconstituteDisabilityStatus(raw);

      // 8. Reconstitute Birth Location
      const birthLocation = this.reconstituteBirthLocation(raw);

      // 9. Reconstitute Death Location
      const deathLocation = this.reconstituteDeathLocation(raw);

      // 10. Assemble FamilyMemberProps
      const props: FamilyMemberProps = {
        id: raw.id,
        userId: raw.userId ?? undefined,
        familyId: raw.familyId,
        name,
        identity,
        contactInfo,
        lifeStatus,
        ageCalculation,
        demographicInfo,
        disabilityStatus,
        birthLocation,
        deathLocation,
        occupation: raw.occupation ?? undefined,
        polygamousHouseId: raw.polygamousHouseId ?? undefined,
        version: raw.version,
        lastEventId: raw.lastEventId ?? undefined,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
        deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : undefined,
        deletedBy: raw.deletedBy ?? undefined,
        deletionReason: raw.deletionReason ?? undefined,
        isArchived: raw.isArchived,
      };

      return FamilyMember.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting FamilyMember from persistence:', error);
      throw new Error(`Failed to reconstitute FamilyMember ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain FamilyMember aggregate to Prisma create/update input
   * Flattens complex Value Objects for persistence
   */
  toPersistence(entity: FamilyMember): Prisma.FamilyMemberUncheckedCreateInput {
    // Get JSON representations of all Value Objects
    const nameJson = this.extractNameForPersistence(entity);
    const identityJson = this.extractIdentityForPersistence(entity);
    const contactInfoJson = this.extractContactInfoForPersistence(entity);
    const lifeStatusJson = this.extractLifeStatusForPersistence(entity);
    const ageCalculationJson = this.extractAgeCalculationForPersistence(entity);
    const demographicInfoJson = this.extractDemographicInfoForPersistence(entity);
    const disabilityStatusJson = this.extractDisabilityStatusForPersistence(entity);
    const birthLocationJson = this.extractBirthLocationForPersistence(entity);
    const deathLocationJson = this.extractDeathLocationForPersistence(entity);

    return {
      id: entity.id,
      userId: entity.userId,
      familyId: entity.familyId,
      polygamousHouseId: entity.polygamousHouseId,

      // Name Fields
      firstName: nameJson.firstName || '',
      lastName: nameJson.lastName || '',
      middleName: nameJson.middleName,
      maidenName: nameJson.maidenName,

      // Identity Fields
      nationalId: identityJson.nationalId?.idNumber,
      nationalIdVerified: identityJson.nationalId?.isVerified || false,
      nationalIdVerifiedAt: identityJson.nationalId?.verifiedAt || null,
      kraPin: identityJson.kraPin?.pinNumber,
      kraPinVerified: identityJson.kraPin?.isVerified || false,
      citizenship: identityJson.citizenship || 'KENYAN',

      // Contact Info Fields
      phoneNumber: contactInfoJson?.primaryPhone,
      email: contactInfoJson?.email,
      alternativePhone: contactInfoJson?.secondaryPhone,
      emergencyContact: contactInfoJson?.emergencyContact
        ? (contactInfoJson.emergencyContact as Prisma.JsonValue)
        : Prisma.JsonNull,

      // Life Status Fields
      isDeceased: lifeStatusJson.isDeceased,
      dateOfDeath: lifeStatusJson.dateOfDeath || null,
      placeOfDeath: lifeStatusJson.placeOfDeath,
      presumedAlive: lifeStatusJson.isAlive,
      missingSince: lifeStatusJson.missingSince || null,
      deathCertificateIssued: lifeStatusJson.deathCertificateIssued || false,
      deathCertificateNumber: identityJson.deathCertificate?.entryNumber,

      // Age Calculation Fields
      dateOfBirth: ageCalculationJson?.dateOfBirth || null,
      ageAtDeath: lifeStatusJson.isDeceased ? ageCalculationJson?.age || null : null,
      currentAge: !lifeStatusJson.isDeceased ? ageCalculationJson?.age || null : null,
      isMinor: ageCalculationJson?.isMinor || false,

      // Demographic Fields
      gender: demographicInfoJson?.gender,
      placeOfBirth: birthLocationJson?.placeName || null,
      religion: demographicInfoJson?.religion || identityJson.religion,
      customaryEthnicGroup: demographicInfoJson?.ethnicGroup || identityJson.ethnicity,
      customaryClan: demographicInfoJson?.clan || identityJson.clan,
      occupation: entity.occupation,

      // Disability Fields
      disabilityStatus: disabilityStatusJson?.hasDisability ? disabilityStatusJson.status : null,
      requiresSupportedDecisionMaking:
        disabilityStatusJson?.requiresSupportedDecisionMaking || false,
      disabilityCertificate: disabilityStatusJson?.disabilityCardNumber || null,

      // Kenyan Location Fields (additional)
      homeCounty: (birthLocationJson?.county as KenyanCounty) || null,
      subCounty: birthLocationJson?.subCounty,
      ward: birthLocationJson?.ward,
      village: birthLocationJson?.village,

      // Audit and Versioning
      version: entity.version,
      lastEventId: entity.lastEventId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      deletedBy: entity.deletedBy,
      deletionReason: entity.deletionReason,
      isArchived: entity.isArchived,
    };
  }

  // Private Helper Methods for Reconstitution

  private reconstituteKenyanName(raw: PrismaFamilyMember): KenyanName {
    const nameProps: KenyanNameProps = {
      firstName: raw.firstName || '',
      lastName: raw.lastName || '',
      middleName: raw.middleName ?? undefined,
      maidenName: raw.maidenName ?? undefined,
    };

    // Use factory method if available, otherwise create directly
    try {
      return KenyanName.create(
        nameProps.firstName,
        nameProps.lastName,
        nameProps.middleName,
      ).withMaidenName(nameProps.maidenName);
    } catch (error) {
      // Fallback: create from props if create method has different signature
      const name = new KenyanName(nameProps);
      if (nameProps.maidenName) {
        // Assuming there's a method to set maiden name
        (name as any).maidenName = nameProps.maidenName;
      }
      return name;
    }
  }

  private reconstituteKenyanIdentity(raw: PrismaFamilyMember): KenyanIdentity {
    const identityProps: Partial<KenyanIdentityProps> = {
      citizenship: (raw.citizenship as any) || 'KENYAN',
      ethnicity: raw.customaryEthnicGroup ?? undefined,
      religion: raw.religion ?? undefined,
      clan: raw.customaryClan ?? undefined,
      appliesCustomaryLaw: raw.customaryEthnicGroup ? true : false,
    };

    let identity = KenyanIdentity.create(identityProps.citizenship);

    // Add National ID if exists
    if (raw.nationalId) {
      let nationalId = NationalId.createUnverified(raw.nationalId);
      if (raw.nationalIdVerified) {
        nationalId = nationalId.verify(
          'DATABASE_RECONSTITUTION',
          raw.nationalIdVerifiedAt ? 'VERIFIED_ON_RECONSTITUTION' : 'STORED_STATE',
        );
        if (raw.nationalIdVerifiedAt) {
          // Manually set verification date if needed
          (nationalId as any).verifiedAt = raw.nationalIdVerifiedAt;
        }
      }
      identity = identity.withNationalId(nationalId);
    }

    // Add KRA PIN if exists
    if (raw.kraPin) {
      let kraPin = KraPin.create(raw.kraPin);
      if (raw.kraPinVerified) {
        kraPin = kraPin.verify('DATABASE_RECONSTITUTION', true);
      }
      identity = identity.withKraPin(kraPin);
    }

    // Add Death Certificate if exists
    if (raw.deathCertificateNumber && raw.dateOfDeath) {
      const deathCert = DeathCertificate.create(
        raw.deathCertificateNumber,
        raw.dateOfDeath,
        raw.dateOfDeath, // Use date of death as issue date if not available
        raw.placeOfDeath || '',
      );
      identity = identity.withDeathCertificate(deathCert);
    }

    // Add cultural details
    if (raw.customaryEthnicGroup || raw.religion || raw.customaryClan) {
      identity = identity.withCulturalDetails(
        raw.customaryEthnicGroup || '',
        raw.religion || '',
        raw.customaryClan,
      );
    }

    // Set legal verification status
    if (raw.nationalIdVerified && raw.kraPinVerified) {
      identity = identity.markAsLegallyVerified(new Date());
    }

    return identity;
  }

  private reconstituteContactInfo(raw: PrismaFamilyMember): ContactInfo | undefined {
    if (!raw.phoneNumber && !raw.email) {
      return undefined;
    }

    try {
      const contactProps: ContactInfoProps = {
        primaryPhone: raw.phoneNumber || '',
        email: raw.email ?? undefined,
        secondaryPhone: raw.alternativePhone ?? undefined,
        emergencyContact: (raw.emergencyContact as any) ?? undefined,
      };

      return ContactInfo.create(
        contactProps.primaryPhone,
        'UNKNOWN', // County will need to be updated separately
      )
        .updateEmail(contactProps.email)
        .updateSecondaryPhone(contactProps.secondaryPhone);
    } catch (error) {
      console.warn('Failed to reconstitute ContactInfo:', error);
      return undefined;
    }
  }

  private reconstituteLifeStatus(raw: PrismaFamilyMember): LifeStatus {
    if (raw.isDeceased && raw.dateOfDeath) {
      const lifeStatus = LifeStatus.createDeceased(raw.dateOfDeath, raw.placeOfDeath ?? undefined);

      if (raw.missingSince) {
        // If deceased but also marked missing, adjust as needed
        return lifeStatus;
      }
      return lifeStatus;
    }

    let lifeStatus = LifeStatus.createAlive();

    if (raw.missingSince) {
      lifeStatus = lifeStatus.markMissing(raw.missingSince, raw.placeOfDeath ?? undefined);
    }

    return lifeStatus;
  }

  private reconstituteAgeCalculation(raw: PrismaFamilyMember): AgeCalculation | undefined {
    if (!raw.dateOfBirth) return undefined;

    try {
      return AgeCalculation.create(raw.dateOfBirth);
    } catch (error) {
      console.warn('Failed to reconstitute AgeCalculation:', error);
      return undefined;
    }
  }

  private reconstituteDemographicInfo(raw: PrismaFamilyMember): DemographicInfo | undefined {
    if (!raw.gender && !raw.religion && !raw.customaryEthnicGroup) {
      return undefined;
    }

    let demographicInfo = DemographicInfo.create();

    if (raw.gender) {
      demographicInfo = demographicInfo.updateGender(raw.gender as any);
    }

    if (raw.religion) {
      demographicInfo = demographicInfo.updateReligion(raw.religion as any);
    }

    if (raw.customaryEthnicGroup) {
      demographicInfo = demographicInfo.updateEthnicity(
        raw.customaryEthnicGroup,
        raw.customaryClan ?? undefined,
      );
    }

    return demographicInfo;
  }

  private reconstituteDisabilityStatus(raw: PrismaFamilyMember): DisabilityStatus | undefined {
    if (!raw.disabilityStatus && !raw.requiresSupportedDecisionMaking) {
      return undefined;
    }

    const disabilityStatus = DisabilityStatus.create(!!raw.disabilityStatus);

    if (raw.requiresSupportedDecisionMaking) {
      disabilityStatus.setSupportedDecisionMaking(true);
    }

    if (raw.disabilityCertificate) {
      // Assuming there's a method to set disability card number
      (disabilityStatus as any).disabilityCardNumber = raw.disabilityCertificate;
    }

    return disabilityStatus;
  }

  private reconstituteBirthLocation(raw: PrismaFamilyMember): KenyanLocation | undefined {
    if (!raw.placeOfBirth) return undefined;

    try {
      const locationProps: KenyanLocationProps = {
        county: (raw.homeCounty as KenyanCounty) || ('UNKNOWN' as any),
        subCounty: raw.subCounty ?? undefined,
        ward: raw.ward ?? undefined,
        village: raw.village ?? undefined,
        placeName: raw.placeOfBirth,
        isUrban: false,
        isRural: true,
      };

      return KenyanLocation.createFromProps(locationProps);
    } catch (error) {
      console.warn('Failed to reconstitute BirthLocation:', error);
      return undefined;
    }
  }

  private reconstituteDeathLocation(raw: PrismaFamilyMember): KenyanLocation | undefined {
    if (!raw.placeOfDeath) return undefined;

    try {
      const locationProps: KenyanLocationProps = {
        county: 'UNKNOWN' as any, // Death location county not stored
        placeName: raw.placeOfDeath,
        isUrban: false,
        isRural: true,
      };

      return KenyanLocation.createFromProps(locationProps);
    } catch (error) {
      console.warn('Failed to reconstitute DeathLocation:', error);
      return undefined;
    }
  }

  // Private Helper Methods for Persistence Extraction

  private extractNameForPersistence(entity: FamilyMember): KenyanNameProps {
    return {
      firstName: entity.name.firstName,
      lastName: entity.name.lastName,
      middleName: entity.name.middleName,
      maidenName: entity.maidenName,
    };
  }

  private extractIdentityForPersistence(entity: FamilyMember): any {
    const identityJson = entity.identity.toJSON();

    return {
      ...identityJson,
      // Ensure we extract the nested values properly
      nationalId: identityJson.nationalId,
      kraPin: identityJson.kraPin,
      deathCertificate: identityJson.deathCertificate,
      citizenship: identityJson.citizenship,
      ethnicity: identityJson.ethnicity,
      religion: identityJson.religion,
      clan: identityJson.clan,
    };
  }

  private extractContactInfoForPersistence(entity: FamilyMember): ContactInfoProps | undefined {
    if (!entity.contactInfo) return undefined;

    const contactJson = entity.contactInfo.toJSON();

    return {
      primaryPhone: contactJson.primaryPhone,
      email: contactJson.email,
      secondaryPhone: contactJson.secondaryPhone,
      emergencyContact: contactJson.emergencyContact,
    };
  }

  private extractLifeStatusForPersistence(entity: FamilyMember): LifeStatusProps {
    const lifeStatusJson = entity.lifeStatus.toJSON();

    return {
      isAlive: lifeStatusJson.isAlive,
      isDeceased: lifeStatusJson.isDeceased,
      dateOfDeath: lifeStatusJson.dateOfDeath,
      placeOfDeath: lifeStatusJson.placeOfDeath,
      missingSince: lifeStatusJson.missingSince,
      deathCertificateIssued: lifeStatusJson.deathCertificateIssued,
    };
  }

  private extractAgeCalculationForPersistence(entity: FamilyMember): any {
    if (!entity.ageCalculation) return undefined;

    const ageJson = entity.ageCalculation.toJSON();

    return {
      dateOfBirth: ageJson.dateOfBirth,
      age: ageJson.age,
      isMinor: ageJson.isMinor,
      isYoungAdult: ageJson.isYoungAdult,
      isElderly: ageJson.isElderly,
    };
  }

  private extractDemographicInfoForPersistence(
    entity: FamilyMember,
  ): DemographicInfoProps | undefined {
    if (!entity.demographicInfo) return undefined;

    const demoJson = entity.demographicInfo.toJSON();

    return {
      gender: demoJson.gender,
      religion: demoJson.religion,
      ethnicGroup: demoJson.ethnicGroup,
      clan: demoJson.clan,
      subClan: demoJson.subClan,
      isMuslim: demoJson.isMuslim,
    };
  }

  private extractDisabilityStatusForPersistence(
    entity: FamilyMember,
  ): DisabilityStatusProps | undefined {
    if (!entity.disabilityStatus) return undefined;

    const disabilityJson = entity.disabilityStatus.toJSON();

    return {
      hasDisability: disabilityJson.hasDisability,
      status: disabilityJson.status,
      requiresSupportedDecisionMaking: disabilityJson.requiresSupportedDecisionMaking,
      disabilityCardNumber: disabilityJson.disabilityCardNumber,
      registeredWithNCPWD: disabilityJson.registeredWithNCPWD,
    };
  }

  private extractBirthLocationForPersistence(
    entity: FamilyMember,
  ): KenyanLocationProps | undefined {
    if (!entity.birthLocation) return undefined;

    const locationJson = entity.birthLocation.toJSON();

    return {
      county: locationJson.county,
      subCounty: locationJson.subCounty,
      ward: locationJson.ward,
      village: locationJson.village,
      placeName: locationJson.placeName,
      isUrban: locationJson.isUrban,
      isRural: locationJson.isRural,
    };
  }

  private extractDeathLocationForPersistence(
    entity: FamilyMember,
  ): KenyanLocationProps | undefined {
    if (!entity.deathLocation) return undefined;

    const locationJson = entity.deathLocation.toJSON();

    return {
      county: locationJson.county,
      subCounty: locationJson.subCounty,
      ward: locationJson.ward,
      village: locationJson.village,
      placeName: locationJson.placeName,
      isUrban: locationJson.isUrban,
      isRural: locationJson.isRural,
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
      // relationshipsFrom: true,
      // relationshipsTo: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: FamilyMember, raw: PrismaFamilyMember): boolean {
    const errors: string[] = [];

    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    if (entity.familyId !== raw.familyId) {
      errors.push(`Family ID mismatch: Domain=${entity.familyId}, Persistence=${raw.familyId}`);
    }

    // Validate name consistency
    if (entity.name.firstName !== (raw.firstName || '')) {
      errors.push(
        `First name mismatch: Domain=${entity.name.firstName}, Persistence=${raw.firstName}`,
      );
    }

    // Validate life status consistency
    if (entity.isDeceased !== raw.isDeceased) {
      errors.push(
        `Deceased status mismatch: Domain=${entity.isDeceased}, Persistence=${raw.isDeceased}`,
      );
    }

    if (errors.length > 0) {
      console.warn('FamilyMember mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Creates a partial update DTO from domain changes
   */
  getChangedFields(
    oldEntity: FamilyMember,
    newEntity: FamilyMember,
  ): Partial<Prisma.FamilyMemberUncheckedUpdateInput> {
    const changed: Partial<Prisma.FamilyMemberUncheckedUpdateInput> = {};

    // Compare and add changed fields
    if (oldEntity.name.firstName !== newEntity.name.firstName)
      changed.firstName = newEntity.name.firstName;
    if (oldEntity.name.lastName !== newEntity.name.lastName)
      changed.lastName = newEntity.name.lastName;
    if (oldEntity.name.middleName !== newEntity.name.middleName)
      changed.middleName = newEntity.name.middleName;
    if (oldEntity.maidenName !== newEntity.maidenName) changed.maidenName = newEntity.maidenName;

    if (oldEntity.occupation !== newEntity.occupation) changed.occupation = newEntity.occupation;
    if (oldEntity.polygamousHouseId !== newEntity.polygamousHouseId)
      changed.polygamousHouseId = newEntity.polygamousHouseId;

    // Always update these fields
    changed.version = newEntity.version;
    changed.lastEventId = newEntity.lastEventId;
    changed.updatedAt = newEntity.updatedAt;
    changed.isArchived = newEntity.isArchived;
    changed.deletedAt = newEntity.deletedAt;

    return changed;
  }
}
