// application/family/mappers/request-to-domain.mapper.ts
import { Injectable } from '@nestjs/common';
import { MarriageType } from '@prisma/client';

import { CreateFamilyProps, Family } from '../../../domain/aggregates/family.aggregate';
import {
  CreateFamilyMemberProps,
  FamilyMember,
} from '../../../domain/entities/family-member.entity';
import { CreateMarriageProps, Marriage } from '../../../domain/entities/marriage.entity';
import {
  CreatePolygamousHouseProps,
  PolygamousHouse,
} from '../../../domain/entities/polygamous-house.entity';
import { AddFamilyMemberRequest } from '../dto/request/add-family-member.request';
import { AddPolygamousHouseRequest } from '../dto/request/add-polygamous-house.request';
import { ArchiveFamilyRequest } from '../dto/request/archive-family.request';
import { CreateFamilyRequest } from '../dto/request/create-family.request';
import { RegisterMarriageRequest } from '../dto/request/register-marriage.request';
import { UpdateFamilyMemberRequest } from '../dto/request/update-family-member.request';
import { UpdateFamilyRequest } from '../dto/request/update-family.request';

@Injectable()
export class RequestToDomainMapper {
  // Family Mappings
  toCreateFamilyProps(request: CreateFamilyRequest): CreateFamilyProps {
    return {
      name: request.name,
      creatorId: request.creatorId,
      description: request.description,
      clanName: request.clanName,
      subClan: request.subClan,
      ancestralHome: request.ancestralHome,
      familyTotem: request.familyTotem,
      homeCounty: request.homeCounty,
      subCounty: request.subCounty,
      ward: request.ward,
      village: request.village,
      placeName: request.placeName,
    };
  }

  toUpdateFamilyProps(request: UpdateFamilyRequest) {
    return {
      name: request.name,
      description: request.description,
      clanName: request.clanName,
      subClan: request.subClan,
      ancestralHome: request.ancestralHome,
      familyTotem: request.familyTotem,
      homeCounty: request.homeCounty,
    };
  }

  toArchiveFamilyParams(request: ArchiveFamilyRequest) {
    return {
      reason: request.reason,
      deletedBy: request.archivedByUserId,
    };
  }

  // Family Member Mappings
  toCreateFamilyMemberProps(request: AddFamilyMemberRequest): CreateFamilyMemberProps {
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
    const props: any = {
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
    };

    // Disability status
    if (request.disabilityType !== undefined) {
      props.disabilityType = request.disabilityType;
      props.requiresSupportedDecisionMaking = request.requiresSupportedDecisionMaking || false;
    }

    // Death marking
    if (request.markAsDeceased) {
      props.isDeceased = true;
      props.dateOfDeath = request.dateOfDeath;
      props.placeOfDeath = request.placeOfDeath;
      props.deathCertificateNumber = request.deathCertificateNumber;
      props.causeOfDeath = request.causeOfDeath;
    }

    return props;
  }

  toMarkAsDeceasedParams(request: UpdateFamilyMemberRequest) {
    if (!request.markAsDeceased) {
      return null;
    }

    return {
      dateOfDeath: request.dateOfDeath!,
      placeOfDeath: request.placeOfDeath,
      deathCertificateNumber: request.deathCertificateNumber,
      causeOfDeath: request.causeOfDeath,
      issuingAuthority: request.deathCertificateIssuingAuthority,
    };
  }

  toUpdateDisabilityParams(request: UpdateFamilyMemberRequest) {
    if (request.disabilityType === undefined) {
      return null;
    }

    return {
      disabilityType: request.disabilityType,
      requiresSupportedDecisionMaking: request.requiresSupportedDecisionMaking || false,
      certificateId: request.disabilityCertificateId,
    };
  }

  // Marriage Mappings
  toCreateMarriageProps(request: RegisterMarriageRequest): CreateMarriageProps {
    return {
      familyId: request.familyId,
      spouse1Id: request.spouse1Id,
      spouse2Id: request.spouse2Id,
      type: request.type,
      startDate: request.startDate,
      registrationNumber: request.registrationNumber,
      issuingAuthority: request.issuingAuthority,
      certificateIssueDate: request.certificateIssueDate,
      registrationDistrict: request.registrationDistrict,
      isCustomary:
        request.type === MarriageType.CUSTOMARY || request.type === MarriageType.TRADITIONAL,
      customaryType: request.customaryType,
      ethnicGroup: request.ethnicGroup,
      dowryPaid: request.dowryPaid,
      dowryAmount: request.dowryAmount,
      dowryCurrency: request.dowryCurrency,
      elderWitnesses: request.elderWitnesses,
      ceremonyLocation: request.ceremonyLocation,
      clanApproval: request.clanApproval,
      clanApprovalDate: request.clanApprovalDate,
      familyConsent: request.familyConsent,
      familyConsentDate: request.familyConsentDate,
      isIslamic: request.type === MarriageType.ISLAMIC,
      nikahDate: request.nikahDate,
      nikahLocation: request.nikahLocation,
      imamName: request.imamName,
      waliName: request.waliName,
      mahrAmount: request.mahrAmount,
      mahrCurrency: request.mahrCurrency,
      isPolygamous: request.isPolygamous,
      s40CertificateNumber: request.s40CertificateNumber,
      isMatrimonialPropertyRegime: request.isMatrimonialPropertyRegime,
      spouse1MaritalStatusAtMarriage: request.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: request.spouse2MaritalStatusAtMarriage,
    };
  }

  toDissolveMarriageParams(request: any) {
    return {
      date: request.date,
      reason: request.reason,
      courtDecreeNumber: request.courtDecreeNumber,
      divorceCourt: request.divorceCourt,
      returnOfBridePrice: request.returnOfBridePrice,
      dissolutionType: request.dissolutionType,
    };
  }

  toAssignPolygamousHouseParams(request: any) {
    return {
      houseId: request.houseId,
      s40CertificateNumber: request.s40CertificateNumber,
    };
  }

  // Polygamous House Mappings
  toCreatePolygamousHouseProps(request: AddPolygamousHouseRequest): CreatePolygamousHouseProps {
    return {
      familyId: request.familyId,
      houseHeadId: request.houseHeadId,
      houseName: request.houseName,
      houseOrder: request.houseOrder,
      establishedDate: request.establishedDate,
      courtRecognized: request.courtRecognized || false,
      s40CertificateNumber: request.s40CertificateNumber,
      certificateIssuedDate: request.certificateIssuedDate,
      certificateIssuingCourt: request.certificateIssuingCourt,
      wivesConsentObtained: request.wivesConsentObtained || false,
      wivesConsentDocument: request.wivesConsentDocument,
      wivesAgreementDetails: request.wivesAgreementDetails,
      houseSharePercentage: request.houseSharePercentage,
      houseBusinessName: request.houseBusinessName,
      houseBusinessKraPin: request.houseBusinessKraPin,
    };
  }

  toCertifyHouseParams(request: any) {
    return {
      certificateNumber: request.certificateNumber,
      courtStation: request.courtStation,
      issuedDate: request.issuedDate,
    };
  }

  toChangeHouseHeadParams(request: any) {
    return {
      newHeadId: request.newHeadId,
      reason: request.reason,
    };
  }

  toRecordWivesConsentParams(request: any) {
    return {
      consentObtained: request.consentObtained,
      consentDocument: request.consentDocument,
      agreementDetails: request.agreementDetails,
    };
  }

  // Bulk operation mappings
  toBatchMemberUpdates(requests: UpdateFamilyMemberRequest[]) {
    return requests.map((req) => this.toUpdateFamilyMemberProps(req));
  }

  toBatchMarriageUpdates(requests: any[]) {
    return requests.map((req) => this.toCreateMarriageProps(req));
  }

  // Validation helper methods
  validateCreateFamilyRequest(request: CreateFamilyRequest): string[] {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length < 2) {
      errors.push('Family name must be at least 2 characters');
    }

    if (!request.creatorId) {
      errors.push('Creator ID is required');
    }

    return errors;
  }

  validateAddFamilyMemberRequest(request: AddFamilyMemberRequest): string[] {
    const errors: string[] = [];

    if (!request.familyId) {
      errors.push('Family ID is required');
    }

    if (!request.firstName || !request.lastName) {
      errors.push('First name and last name are required');
    }

    if (request.nationalId && !/^\d{8,9}$/.test(request.nationalId)) {
      errors.push('National ID must be 8-9 digits');
    }

    if (request.kraPin && !/^[A-Z]{1}\d{9}[A-Z]{1}$/.test(request.kraPin)) {
      errors.push('Invalid KRA PIN format');
    }

    if (request.isDeceased && !request.dateOfDeath) {
      errors.push('Date of death is required for deceased members');
    }

    if (
      request.disabilityDetails?.requiresSupportedDecisionMaking &&
      !request.disabilityDetails?.disabilityType
    ) {
      errors.push('Disability type is required when requiring supported decision making');
    }

    return errors;
  }

  validateRegisterMarriageRequest(request: RegisterMarriageRequest): string[] {
    const errors: string[] = [];

    if (!request.familyId) {
      errors.push('Family ID is required');
    }

    if (!request.spouse1Id || !request.spouse2Id) {
      errors.push('Both spouse IDs are required');
    }

    if (request.spouse1Id === request.spouse2Id) {
      errors.push('Spouses cannot be the same person');
    }

    if (!request.type) {
      errors.push('Marriage type is required');
    }

    if (!request.startDate || request.startDate > new Date()) {
      errors.push('Valid start date is required');
    }

    // Customary marriage validations
    if (
      (request.type === MarriageType.CUSTOMARY || request.type === MarriageType.TRADITIONAL) &&
      !request.ethnicGroup
    ) {
      errors.push('Ethnic group is required for customary marriages');
    }

    // Islamic marriage validations
    if (request.type === MarriageType.ISLAMIC && !request.waliName) {
      errors.push('Wali name is required for Islamic marriages');
    }

    // S.40 validations
    if (request.isPolygamous && !request.s40CertificateNumber) {
      errors.push('S.40 certificate number is required for polygamous marriages');
    }

    return errors;
  }

  validateAddPolygamousHouseRequest(request: AddPolygamousHouseRequest): string[] {
    const errors: string[] = [];

    if (!request.familyId) {
      errors.push('Family ID is required');
    }

    if (!request.houseName || request.houseName.trim().length < 2) {
      errors.push('House name must be at least 2 characters');
    }

    if (!request.houseOrder || request.houseOrder < 1) {
      errors.push('House order must be 1 or greater');
    }

    if (!request.establishedDate || request.establishedDate > new Date()) {
      errors.push('Valid established date is required');
    }

    if (request.courtRecognized && !request.s40CertificateNumber) {
      errors.push('S.40 certificate number is required for court recognized houses');
    }

    if (request.houseOrder > 1 && !request.wivesConsentObtained) {
      errors.push('Wives consent is required for subsequent polygamous houses');
    }

    if (
      request.houseSharePercentage &&
      (request.houseSharePercentage < 0 || request.houseSharePercentage > 100)
    ) {
      errors.push('House share percentage must be between 0 and 100');
    }

    return errors;
  }

  // Domain object creation from props (for testing or manual creation)
  createFamilyFromProps(props: CreateFamilyProps): Family {
    return Family.create(props);
  }

  createFamilyMemberFromProps(props: CreateFamilyMemberProps): FamilyMember {
    return FamilyMember.create(props);
  }

  createMarriageFromProps(props: CreateMarriageProps): Marriage {
    return Marriage.create(props);
  }

  createPolygamousHouseFromProps(props: CreatePolygamousHouseProps): PolygamousHouse {
    return PolygamousHouse.create(props);
  }
}
