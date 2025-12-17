// application/family/mappers/family-member.mapper.ts
import { Injectable } from '@nestjs/common';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { AddFamilyMemberRequest } from '../dto/request/add-family-member.request';
import { UpdateFamilyMemberRequest } from '../dto/request/update-family-member.request';
import { FamilyMemberResponse } from '../dto/response/family-member.response';
import { BaseMapper } from './base.mapper';

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
    // Map database representation to domain entity
    // Note: This requires reconstructing all value objects
    // For simplicity, we're showing a basic mapping
    // In production, you'd need to reconstruct all VOs

    const props = {
      id: dto.id,
      userId: dto.userId,
      familyId: dto.familyId,
      name: dto.name, // This should be KenyanName VO
      identity: dto.identity, // This should be KenyanIdentity VO
      lifeStatus: dto.lifeStatus, // This should be LifeStatus VO
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
    const identityJSON = memberJSON.identity;
    const contactInfoJSON = memberJSON.contactInfo;
    const disabilityStatusJSON = memberJSON.disabilityStatus;
    const lifeStatusJSON = memberJSON.lifeStatus;
    const demographicInfoJSON = memberJSON.demographicInfo;
    const ageCalculationJSON = memberJSON.ageCalculation;
    const birthLocationJSON = memberJSON.birthLocation;
    const deathLocationJSON = memberJSON.deathLocation;

    return {
      id: memberJSON.id,
      userId: memberJSON.userId,
      familyId: memberJSON.familyId,
      name: {
        firstName: nameJSON.firstName,
        lastName: nameJSON.lastName,
        middleName: nameJSON.middleName,
        maidenName: nameJSON.maidenName,
        fullName: nameJSON.fullName,
      },
      identity: {
        citizenship: identityJSON.citizenship,
        nationalId: identityJSON.nationalId
          ? {
              number: identityJSON.nationalId.number,
              type: 'NATIONAL_ID',
              isVerified: identityJSON.nationalId.isVerified,
              verifiedAt: identityJSON.nationalId.verifiedAt,
              verifiedBy: identityJSON.nationalId.verifiedBy,
              verificationMethod: identityJSON.nationalId.verificationMethod,
            }
          : undefined,
        kraPin: identityJSON.kraPin
          ? {
              number: identityJSON.kraPin.number,
              type: 'KRA_PIN',
              isVerified: identityJSON.kraPin.isVerified,
              verifiedAt: identityJSON.kraPin.verifiedAt,
              verifiedBy: identityJSON.kraPin.verifiedBy,
              verificationMethod: identityJSON.kraPin.verificationMethod,
            }
          : undefined,
        birthCertificate: identityJSON.birthCertificate
          ? {
              number: identityJSON.birthCertificate.number,
              type: 'BIRTH_CERTIFICATE',
              isVerified: identityJSON.birthCertificate.isVerified,
              verifiedAt: identityJSON.birthCertificate.verifiedAt,
              verifiedBy: identityJSON.birthCertificate.verifiedBy,
              verificationMethod: identityJSON.birthCertificate.verificationMethod,
            }
          : undefined,
        deathCertificate: identityJSON.deathCertificate
          ? {
              number: identityJSON.deathCertificate.number,
              type: 'DEATH_CERTIFICATE',
              isVerified: identityJSON.deathCertificate.isVerified,
              verifiedAt: identityJSON.deathCertificate.verifiedAt,
              verifiedBy: identityJSON.deathCertificate.verifiedBy,
              verificationMethod: identityJSON.deathCertificate.verificationMethod,
            }
          : undefined,
        isLegallyVerified: identityJSON.isLegallyVerified,
        ethnicity: identityJSON.ethnicity,
        religion: identityJSON.religion,
        clan: identityJSON.clan,
        appliesCustomaryLaw: identityJSON.appliesCustomaryLaw,
      },
      contactInfo: contactInfoJSON
        ? {
            primaryPhone: contactInfoJSON.primaryPhone,
            secondaryPhone: contactInfoJSON.secondaryPhone,
            email: contactInfoJSON.email,
            county: contactInfoJSON.county,
            subCounty: contactInfoJSON.subCounty,
            ward: contactInfoJSON.ward,
            streetAddress: contactInfoJSON.streetAddress,
            postalAddress: contactInfoJSON.postalAddress,
          }
        : undefined,
      disabilityStatus: disabilityStatusJSON
        ? {
            hasDisability: disabilityStatusJSON.hasDisability,
            disabilityType: disabilityStatusJSON.disabilityType,
            requiresSupportedDecisionMaking: disabilityStatusJSON.requiresSupportedDecisionMaking,
            disabilityCardNumber: disabilityStatusJSON.disabilityCardNumber,
            registeredWithNCPWD: disabilityStatusJSON.registeredWithNCPWD,
            qualifiesForDependantStatus: disabilityStatusJSON.qualifiesForDependantStatus,
          }
        : undefined,
      lifeStatus: {
        status: lifeStatusJSON.status,
        isDeceased: lifeStatusJSON.isDeceased,
        isAlive: lifeStatusJSON.isAlive,
        dateOfDeath: lifeStatusJSON.dateOfDeath,
        causeOfDeath: lifeStatusJSON.causeOfDeath,
        placeOfDeath: lifeStatusJSON.placeOfDeath,
        missingSince: lifeStatusJSON.missingSince,
        lastSeenLocation: lifeStatusJSON.lastSeenLocation,
      },
      demographicInfo: demographicInfoJSON
        ? {
            gender: demographicInfoJSON.gender,
            religion: demographicInfoJSON.religion,
            ethnicGroup: demographicInfoJSON.ethnicGroup,
            subEthnicGroup: demographicInfoJSON.subEthnicGroup,
            isMuslim: demographicInfoJSON.isMuslim,
            isCustomaryLawApplicable: demographicInfoJSON.isCustomaryLawApplicable,
          }
        : undefined,
      ageCalculation: ageCalculationJSON
        ? {
            dateOfBirth: ageCalculationJSON.dateOfBirth,
            age: ageCalculationJSON.age,
            isMinor: ageCalculationJSON.isMinor,
            isYoungAdult: ageCalculationJSON.isYoungAdult,
            isElderly: ageCalculationJSON.isElderly,
            isOfMajorityAge: ageCalculationJSON.isOfMajorityAge,
          }
        : undefined,
      birthLocation: birthLocationJSON
        ? {
            county: birthLocationJSON.county,
            subCounty: birthLocationJSON.subCounty,
            ward: birthLocationJSON.ward,
            placeName: birthLocationJSON.placeName,
            isRural: birthLocationJSON.isRural,
            isUrban: birthLocationJSON.isUrban,
          }
        : undefined,
      deathLocation: deathLocationJSON
        ? {
            county: deathLocationJSON.county,
            subCounty: deathLocationJSON.subCounty,
            ward: deathLocationJSON.ward,
            placeName: deathLocationJSON.placeName,
            isRural: deathLocationJSON.isRural,
            isUrban: deathLocationJSON.isUrban,
          }
        : undefined,
      occupation: memberJSON.occupation,
      polygamousHouseId: memberJSON.polygamousHouseId,
      isDeceased: memberJSON.isDeceased,
      isMinor: memberJSON.isMinor,
      currentAge: memberJSON.currentAge,
      isPotentialDependant: memberJSON.isPotentialDependant,
      isIdentityVerified: memberJSON.isIdentityVerified,
      hasDisability: memberJSON.hasDisability,
      requiresSupportedDecisionMaking: memberJSON.requiresSupportedDecisionMaking,
      isPresumedAlive: memberJSON.isPresumedAlive,
      deathCertificateIssued: memberJSON.deathCertificateIssued,
      isActive: memberJSON.isActive,
      isEligibleForInheritance: memberJSON.isEligibleForInheritance,
      gender: memberJSON.gender,
      religion: memberJSON.religion,
      ethnicity: memberJSON.ethnicity,
      isMuslim: memberJSON.isMuslim,
      isCustomaryLawApplicable: memberJSON.isCustomaryLawApplicable,
      isArchived: memberJSON.isArchived,
      deletedAt: memberJSON.deletedAt,
      deletedBy: memberJSON.deletedBy,
      deletionReason: memberJSON.deletionReason,
      missingSince: memberJSON.missingSince,
      version: memberJSON.version,
      createdAt: memberJSON.createdAt,
      updatedAt: memberJSON.updatedAt,
    };
  }

  toDomainList(dtos: any[]): FamilyMember[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(members: FamilyMember[]): FamilyMemberResponse[] {
    return members.map((member) => this.toDTO(member));
  }

  // For family tree nodes
  toTreeNodeDTO(familyMember: FamilyMember) {
    const memberJSON = familyMember.toJSON();
    const nameJSON = memberJSON.name;

    return {
      id: memberJSON.id,
      name: nameJSON.fullName,
      firstName: nameJSON.firstName,
      lastName: nameJSON.lastName,
      middleName: nameJSON.middleName,
      maidenName: nameJSON.maidenName,
      gender: memberJSON.gender,
      dateOfBirth: memberJSON.dateOfBirth,
      age: memberJSON.currentAge || 0,
      isDeceased: memberJSON.isDeceased,
      dateOfDeath: memberJSON.dateOfDeath,
      isMinor: memberJSON.isMinor,
      hasDisability: memberJSON.hasDisability,
      occupation: memberJSON.occupation,
      generation: 0, // To be set by tree builder
      depth: 0, // To be set by tree builder
      x: 0, // To be set by tree layout
      y: 0, // To be set by tree layout
      width: 200,
      height: 60,
      isExpanded: true,
      relationshipToRoot: 'ROOT', // To be set by tree builder
      spouses: [],
      children: [],
      parents: [],
      siblings: [],
    };
  }

  // For summary views (lists, dropdowns)
  toSummaryDTO(familyMember: FamilyMember) {
    const memberJSON = familyMember.toJSON();
    const nameJSON = memberJSON.name;

    return {
      id: memberJSON.id,
      name: nameJSON.fullName,
      firstName: nameJSON.firstName,
      lastName: nameJSON.lastName,
      gender: memberJSON.gender,
      age: memberJSON.currentAge,
      isDeceased: memberJSON.isDeceased,
      isMinor: memberJSON.isMinor,
      isIdentityVerified: memberJSON.isIdentityVerified,
      isActive: memberJSON.isActive,
      polygamousHouseId: memberJSON.polygamousHouseId,
      lastUpdated: memberJSON.updatedAt,
    };
  }
}
