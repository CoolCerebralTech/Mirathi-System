import { Injectable } from '@nestjs/common';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { AddFamilyMemberRequest } from '../dto/request/add-family-member.request';
import { UpdateFamilyMemberRequest } from '../dto/request/update-family-member.request';
import { FamilyMemberResponse } from '../dto/response/family-member.response';
import { FamilyTreeNodeResponse } from '../dto/response/family-tree.response';
import { BaseMapper } from './base.mapper';

// Type-safe helper to cast to any for properties that aren't in the base type
type WithAny<T> = T & { [key: string]: any };

@Injectable()
export class FamilyMemberMapper extends BaseMapper<FamilyMember, FamilyMemberResponse> {
  toCreateFamilyMemberProps(request: AddFamilyMemberRequest) {
    return {
      userId: request.userId,
      familyId: request.familyId,
      firstName: request.firstName,
      lastName: request.lastName,
      middleName: request.middleName,
      nationalId: request.nationalId,
      kraPin: request.kraPin,
      dateOfBirth: request.dateOfBirth,
      gender: request.gender,
      citizenship: request.citizenship || 'KENYAN',
      religion: request.religion,
      ethnicity: request.ethnicity,
      clan: request.clan,
      subClan: request.subClan,
      phoneNumber: request.phoneNumber,
      email: request.email,
      placeOfBirth: request.placeOfBirth,
      occupation: request.occupation,
      maidenName: request.maidenName,
      disabilityType: request.disabilityDetails?.disabilityType,
      requiresSupportedDecisionMaking: request.disabilityDetails?.requiresSupportedDecisionMaking,
      isDeceased: request.isDeceased || false,
      dateOfDeath: request.dateOfDeath,
      deathCertificateNumber: request.deathCertificateNumber,
      placeOfDeath: request.placeOfDeath,
      isMinor: request.isMinor || false,
      birthCertificateEntryNumber: request.birthCertificateEntryNumber,
    };
  }

  toUpdateFamilyMemberProps(request: UpdateFamilyMemberRequest) {
    return {
      firstName: request.firstName,
      lastName: request.lastName,
      middleName: request.middleName,
      maidenName: request.maidenName,
      occupation: request.occupation,
      gender: request.gender,
      religion: request.religion,
      ethnicity: request.ethnicity,
      clan: request.clan,
      subClan: request.subClan,
      phoneNumber: request.phoneNumber,
      email: request.email,
      alternativePhone: request.alternativePhone,
      disabilityType: request.disabilityType,
      requiresSupportedDecisionMaking: request.requiresSupportedDecisionMaking,
      markAsDeceased: request.markAsDeceased,
      dateOfDeath: request.dateOfDeath,
      placeOfDeath: request.placeOfDeath,
      deathCertificateNumber: request.deathCertificateNumber,
      causeOfDeath: request.causeOfDeath,
      deathCertificateIssuingAuthority: request.deathCertificateIssuingAuthority,
    };
  }

  toDomain(dto: any): FamilyMember {
    const props = {
      id: dto.id,
      userId: dto.userId,
      familyId: dto.familyId,
      name: dto.name,
      identity: dto.identity,
      lifeStatus: dto.lifeStatus,
      contactInfo: dto.contactInfo,
      demographicInfo: dto.demographicInfo,
      ageCalculation: dto.ageCalculation,
      disabilityStatus: dto.disabilityStatus,
      birthLocation: dto.birthLocation,
      deathLocation: dto.deathLocation,
      occupation: dto.occupation,
      polygamousHouseId: dto.polygamousHouseId,
      version: dto.version || 1,
      lastEventId: dto.lastEventId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
      deletedBy: dto.deletedBy,
      deletionReason: dto.deletionReason,
      isArchived: dto.isArchived || false,
    };

    return FamilyMember.createFromProps(props);
  }

  toDTO(familyMember: FamilyMember): FamilyMemberResponse {
    const memberJSON = familyMember.toJSON();
    const nameJSON = memberJSON.name;
    const identityJSON = memberJSON.identity as WithAny<typeof memberJSON.identity>;
    const contactInfoJSON = memberJSON.contactInfo as WithAny<typeof memberJSON.contactInfo>;
    const disabilityStatusJSON = memberJSON.disabilityStatus as WithAny<
      typeof memberJSON.disabilityStatus
    >;
    const lifeStatusJSON = memberJSON.lifeStatus as WithAny<typeof memberJSON.lifeStatus>;
    const demographicInfoJSON = memberJSON.demographicInfo as WithAny<
      typeof memberJSON.demographicInfo
    >;
    const ageCalculationJSON = memberJSON.ageCalculation as WithAny<
      typeof memberJSON.ageCalculation
    >;
    const birthLocationJSON = memberJSON.birthLocation as WithAny<typeof memberJSON.birthLocation>;
    const deathLocationJSON = memberJSON.deathLocation as WithAny<typeof memberJSON.deathLocation>;

    const nationalId = identityJSON.nationalId as any;
    const kraPin = identityJSON.kraPin as any;
    const birthCert = identityJSON.birthCertificate as any;
    const deathCert = identityJSON.deathCertificate as any;

    const toDateIfExists = (dateString: string | Date | undefined | null): Date | undefined => {
      if (!dateString) return undefined;
      return dateString instanceof Date ? dateString : new Date(dateString);
    };

    const toStringOrDefault = (value: any, defaultValue: string = ''): string => {
      if (value === null || value === undefined) return defaultValue;
      return String(value);
    };

    const toBoolean = (value: any): boolean => {
      return Boolean(value);
    };

    const getDisabilityType = (disabilityStatus: any): string | undefined => {
      if (
        !disabilityStatus?.disabilityDetails ||
        !Array.isArray(disabilityStatus.disabilityDetails)
      ) {
        return undefined;
      }
      const primaryDisability = disabilityStatus.disabilityDetails[0];
      return primaryDisability?.type;
    };

    const getAgeValue = (ageCalculation: any): number => {
      if (!ageCalculation?.age && ageCalculation?.age !== 0) return 0;
      return Number(ageCalculation.age);
    };

    return {
      id: memberJSON.id,
      userId: memberJSON.userId,
      familyId: memberJSON.familyId,
      name: {
        firstName: toStringOrDefault(nameJSON.firstName),
        lastName: toStringOrDefault(nameJSON.lastName),
        middleName: nameJSON.middleName,
        maidenName: nameJSON.maidenName,
        fullName: toStringOrDefault(nameJSON.fullName),
      },
      identity: {
        citizenship: toStringOrDefault(identityJSON.citizenship, 'KENYAN'),
        isLegallyVerified: toBoolean(identityJSON.isLegallyVerified),
        ethnicity: identityJSON.ethnicity,
        religion: identityJSON.religion,
        clan: identityJSON.clan,
        appliesCustomaryLaw: toBoolean(identityJSON.appliesCustomaryLaw),
        nationalId: nationalId
          ? {
              number: toStringOrDefault(nationalId.idNumber || nationalId.number),
              type: 'NATIONAL_ID',
              isVerified: toBoolean(nationalId.isVerified),
              verifiedAt: toDateIfExists(nationalId.verifiedAt),
              verifiedBy: nationalId.verifiedBy,
              verificationMethod: nationalId.verificationMethod,
            }
          : undefined,
        kraPin: kraPin
          ? {
              number: toStringOrDefault(kraPin.pinNumber || kraPin.number),
              type: 'KRA_PIN',
              isVerified: toBoolean(kraPin.isVerified),
              verifiedAt: toDateIfExists(kraPin.verifiedAt),
              verifiedBy: kraPin.verifiedBy,
              verificationMethod: kraPin.verificationMethod || 'ITAX_SYSTEM',
            }
          : undefined,
        birthCertificate: birthCert
          ? {
              number: toStringOrDefault(birthCert.entryNumber || birthCert.certificateNumber),
              type: 'BIRTH_CERTIFICATE',
              isVerified: toBoolean(birthCert.isVerified),
              verifiedAt: toDateIfExists(birthCert.verifiedAt),
              verifiedBy: birthCert.verifiedBy,
              verificationMethod: birthCert.verificationMethod,
            }
          : undefined,
        deathCertificate: deathCert
          ? {
              number: toStringOrDefault(deathCert.certificateNumber || deathCert.number),
              type: 'DEATH_CERTIFICATE',
              isVerified: toBoolean(deathCert.isVerified),
              verifiedAt: toDateIfExists(deathCert.verifiedAt),
              verifiedBy: deathCert.verifiedBy,
              verificationMethod: deathCert.verificationMethod,
            }
          : undefined,
      },
      contactInfo: contactInfoJSON
        ? {
            primaryPhone: toStringOrDefault(contactInfoJSON.primaryPhone),
            secondaryPhone: contactInfoJSON.secondaryPhone,
            email: contactInfoJSON.email,
            county: contactInfoJSON.primaryAddress?.county,
            subCounty: contactInfoJSON.primaryAddress?.subCounty,
            ward: contactInfoJSON.primaryAddress?.village,
            streetAddress: contactInfoJSON.primaryAddress?.street,
            postalAddress: contactInfoJSON.primaryAddress?.postalAddress,
          }
        : undefined,
      disabilityStatus: disabilityStatusJSON
        ? {
            hasDisability: toBoolean(disabilityStatusJSON.hasDisability),
            disabilityType: getDisabilityType(disabilityStatusJSON),
            requiresSupportedDecisionMaking: toBoolean(
              disabilityStatusJSON.requiresSupportedDecisionMaking,
            ),
            disabilityCardNumber: disabilityStatusJSON.disabilityCardNumber,
            registeredWithNCPWD: toBoolean(disabilityStatusJSON.registeredWithNCPWD),
            qualifiesForDependantStatus: toBoolean(
              disabilityStatusJSON.qualifiesForDependantStatus || false,
            ),
          }
        : undefined,
      lifeStatus: {
        status: lifeStatusJSON.status || 'ALIVE',
        isDeceased: toBoolean(lifeStatusJSON.isDeceased),
        isAlive: toBoolean(lifeStatusJSON.isAlive),
        dateOfDeath: toDateIfExists(lifeStatusJSON.dateOfDeath),
        causeOfDeath: lifeStatusJSON.causeOfDeath,
        placeOfDeath: lifeStatusJSON.placeOfDeath,
        missingSince: toDateIfExists(lifeStatusJSON.missingSince),
        lastSeenLocation: lifeStatusJSON.lastSeenLocation,
      },
      demographicInfo: demographicInfoJSON
        ? {
            gender: toStringOrDefault(demographicInfoJSON.gender),
            religion: demographicInfoJSON.religion,
            ethnicGroup: demographicInfoJSON.ethnicGroup,
            subEthnicGroup:
              demographicInfoJSON.subClan ||
              demographicInfoJSON.clan ||
              demographicInfoJSON.subEthnicGroup,
            isMuslim: toBoolean(demographicInfoJSON.isMuslim),
            isCustomaryLawApplicable: toBoolean(
              demographicInfoJSON.isCustomaryLawApplicable || false,
            ),
          }
        : undefined,
      ageCalculation: ageCalculationJSON
        ? {
            dateOfBirth: ageCalculationJSON.dateOfBirth
              ? new Date(ageCalculationJSON.dateOfBirth)
              : new Date(0),
            age: getAgeValue(ageCalculationJSON),
            isMinor: toBoolean(ageCalculationJSON.isMinor),
            isYoungAdult: toBoolean(ageCalculationJSON.isYoungAdult),
            isElderly: toBoolean(ageCalculationJSON.isElderly),
            isOfMajorityAge: toBoolean(!ageCalculationJSON.isMinor),
          }
        : undefined,
      birthLocation: birthLocationJSON
        ? {
            county: toStringOrDefault(birthLocationJSON.county),
            subCounty: birthLocationJSON.subCounty,
            ward: birthLocationJSON.ward,
            placeName: toStringOrDefault(birthLocationJSON.placeName),
            isRural: toBoolean(birthLocationJSON.isRural),
            isUrban: toBoolean(birthLocationJSON.isUrban),
          }
        : undefined,
      deathLocation: deathLocationJSON
        ? {
            county: toStringOrDefault(deathLocationJSON.county),
            subCounty: deathLocationJSON.subCounty,
            ward: deathLocationJSON.ward,
            placeName: toStringOrDefault(deathLocationJSON.placeName),
            isRural: toBoolean(deathLocationJSON.isRural),
            isUrban: toBoolean(deathLocationJSON.isUrban),
          }
        : undefined,
      occupation: memberJSON.occupation,
      polygamousHouseId: memberJSON.polygamousHouseId,
      isDeceased: toBoolean(memberJSON.isDeceased),
      isMinor: toBoolean(memberJSON.isMinor),
      currentAge: memberJSON.currentAge ?? null,
      isPotentialDependant: toBoolean(memberJSON.isPotentialDependant),
      isIdentityVerified: toBoolean(memberJSON.isIdentityVerified),
      hasDisability: toBoolean(memberJSON.hasDisability),
      requiresSupportedDecisionMaking: toBoolean(memberJSON.requiresSupportedDecisionMaking),
      isPresumedAlive: toBoolean(memberJSON.isPresumedAlive),
      deathCertificateIssued: toBoolean(memberJSON.deathCertificateIssued),
      isActive: toBoolean(memberJSON.isActive),
      isEligibleForInheritance: toBoolean(memberJSON.isEligibleForInheritance),
      gender: toStringOrDefault(memberJSON.gender),
      religion: memberJSON.religion,
      ethnicity: memberJSON.ethnicity,
      isMuslim: toBoolean(memberJSON.isMuslim),
      isCustomaryLawApplicable: toBoolean(memberJSON.isCustomaryLawApplicable),
      isArchived: toBoolean(memberJSON.isArchived),
      deletedAt: toDateIfExists(memberJSON.deletedAt),
      deletedBy: memberJSON.deletedBy,
      deletionReason: memberJSON.deletionReason,
      missingSince: toDateIfExists(memberJSON.missingSince),
      version: memberJSON.version ?? 1,
      createdAt: toDateIfExists(memberJSON.createdAt) ?? new Date(),
      updatedAt: toDateIfExists(memberJSON.updatedAt) ?? new Date(),
    };
  }

  // --- FAMILY TREE MAPPING ---
  toTreeNodeDTO(familyMember: FamilyMember): FamilyTreeNodeResponse {
    const memberJSON = familyMember.toJSON();
    const nameJSON = memberJSON.name;

    const toDateIfExists = (dateString: string | Date | undefined | null): Date | undefined => {
      if (!dateString) return undefined;
      return dateString instanceof Date ? dateString : new Date(dateString);
    };

    return {
      id: memberJSON.id,
      name: nameJSON.fullName || `${nameJSON.firstName} ${nameJSON.lastName}`,
      firstName: nameJSON.firstName || '',
      lastName: nameJSON.lastName || '',
      middleName: nameJSON.middleName,
      maidenName: nameJSON.maidenName,
      gender: memberJSON.gender || 'UNKNOWN',
      // Ensure dateOfBirth is a Date object, default to Epoch if missing
      dateOfBirth: toDateIfExists(memberJSON.ageCalculation?.dateOfBirth) || new Date(0),
      age: memberJSON.currentAge || 0,
      isDeceased: !!memberJSON.isDeceased,
      dateOfDeath: toDateIfExists(memberJSON.lifeStatus?.dateOfDeath),
      isMinor: !!memberJSON.isMinor,
      hasDisability: !!memberJSON.hasDisability,
      occupation: memberJSON.occupation,
      photoUrl: undefined,

      // Layout Defaults (will be updated by Handler)
      generation: 0,
      depth: 0,
      x: 0,
      y: 0,
      width: 200,
      height: 60,
      isExpanded: true,
      relationshipToRoot: 'CHILD', // Default; logic in Handler/Builder should refine this if needed

      // Graph Relations (will be populated by Handler/Builder)
      spouses: [],
      children: [],
      parents: [],
      siblings: [],
    };
  }

  toDomainList(dtos: any[]): FamilyMember[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(members: FamilyMember[]): FamilyMemberResponse[] {
    return members.map((member) => this.toDTO(member));
  }
}
