import { Injectable } from '@nestjs/common';
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { Marriage } from '../../../domain/entities/marriage.entity';
import { RegisterMarriageRequest } from '../dto/request/register-marriage.request';
import { MarriageResponse } from '../dto/response/marriage.response';
import { BaseMapper } from './base.mapper';

// Helper type for safe property access
type WithAny<T> = T & { [key: string]: any };

@Injectable()
export class MarriageMapper extends BaseMapper<Marriage, MarriageResponse> {
  toCreateMarriageProps(request: RegisterMarriageRequest) {
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

  toDomain(dto: any): Marriage {
    const props = {
      id: dto.id,
      familyId: dto.familyId,
      spouse1Id: dto.spouse1Id,
      spouse2Id: dto.spouse2Id,
      type: dto.type as MarriageType,
      details: dto.details,
      dates: dto.dates,
      bridePrice: dto.bridePrice,
      customaryMarriage: dto.customaryMarriage,
      islamicMarriage: dto.islamicMarriage,

      registrationNumber: dto.registrationNumber,
      issuingAuthority: dto.issuingAuthority,
      certificateIssueDate: dto.certificateIssueDate
        ? new Date(dto.certificateIssueDate)
        : undefined,
      registrationDistrict: dto.registrationDistrict,

      endReason: dto.endReason as MarriageEndReason,
      deceasedSpouseId: dto.deceasedSpouseId,
      divorceDecreeNumber: dto.divorceDecreeNumber,
      divorceCourt: dto.divorceCourt,
      divorceDate: dto.divorceDate ? new Date(dto.divorceDate) : undefined,

      isPolygamousUnderS40: dto.isPolygamousUnderS40 || false,
      s40CertificateNumber: dto.s40CertificateNumber,
      polygamousHouseId: dto.polygamousHouseId,

      isMatrimonialPropertyRegime: dto.isMatrimonialPropertyRegime ?? true,
      matrimonialPropertySettled: dto.matrimonialPropertySettled ?? false,

      spouse1MaritalStatusAtMarriage: dto.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: dto.spouse2MaritalStatusAtMarriage,

      separationDate: dto.separationDate ? new Date(dto.separationDate) : undefined,
      separationReason: dto.separationReason,

      maintenanceOrderIssued: dto.maintenanceOrderIssued ?? false,
      maintenanceOrderNumber: dto.maintenanceOrderNumber,

      courtValidationDate: dto.courtValidationDate ? new Date(dto.courtValidationDate) : undefined,
      isValidUnderKenyanLaw: dto.isValidUnderKenyanLaw !== false,
      invalidityReason: dto.invalidityReason,
      isActive: dto.isActive !== false,

      version: dto.version || 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
    };

    return Marriage.createFromProps(props);
  }

  toDTO(marriage: Marriage): MarriageResponse {
    const json = marriage.toJSON();
    const details = (json.details as WithAny<typeof json.details>) || {};
    const dates = (json.dates as WithAny<typeof json.dates>) || {};
    const bridePrice = json.bridePrice as WithAny<typeof json.bridePrice>;
    const customary = json.customaryMarriage as WithAny<typeof json.customaryMarriage>;
    const islamic = json.islamicMarriage as WithAny<typeof json.islamicMarriage>;

    // Helper functions
    const toDate = (dateString: string | Date | undefined | null): Date => {
      if (!dateString) return new Date(0); // Epoch as default
      return dateString instanceof Date ? dateString : new Date(dateString);
    };

    const toDateIfExists = (dateString: string | Date | undefined | null): Date | undefined => {
      if (!dateString) return undefined;
      return dateString instanceof Date ? dateString : new Date(dateString);
    };

    const toBoolean = (value: any): boolean => {
      return Boolean(value);
    };

    const toStringOrDefault = (value: any, defaultValue: string = ''): string => {
      if (value === null || value === undefined) return defaultValue;
      return String(value);
    };

    // Calculate isEnded from endReason or dissolution date
    const isEnded =
      !!(json.endReason && json.endReason !== 'STILL_ACTIVE') ||
      !!dates.dissolutionDate ||
      toBoolean(details.isDissolved) ||
      toBoolean(customary?.isDissolved);

    // Calculate bride price totals
    const totalAmountAgreed = bridePrice?.totalAmountAgreed || 0;
    const totalPaid = bridePrice?.totalPaid || 0;
    const totalOutstanding = Math.max(0, totalAmountAgreed - totalPaid);

    // Calculate bride price status
    const getBridePriceStatus = (bridePrice: any): string => {
      if (!bridePrice) return 'PENDING';
      if (bridePrice.status) return bridePrice.status;
      if (totalPaid >= totalAmountAgreed) return 'FULLY_PAID';
      if (totalPaid > 0) return 'PARTIALLY_PAID';
      return 'PENDING';
    };

    // Get mahr status from islamic marriage
    const getMahrStatus = (islamic: any): string => {
      if (!islamic) return 'PENDING';
      if (islamic.mahrPaidInFull) return 'PAID_IN_FULL';
      if (islamic.mahrPaymentDate) return 'PARTIALLY_PAID';
      if (islamic.deferredMahrAmount) return 'DEFERRED';
      return 'PENDING';
    };

    // Get marriage status
    const getMarriageStatus = (): string => {
      if (isEnded) {
        if (json.endReason === MarriageEndReason.DEATH_OF_SPOUSE) return 'ENDED_BY_DEATH';
        if (json.endReason === MarriageEndReason.DIVORCE) return 'DIVORCED';
        if (json.endReason === MarriageEndReason.ANNULMENT) return 'ANNULLED';
        if (json.endReason === MarriageEndReason.CUSTOMARY_DISSOLUTION)
          return 'CUSTOMARY_DISSOLVED';
        return 'ENDED';
      }
      return json.isActive ? 'ACTIVE' : 'INACTIVE';
    };

    return {
      id: json.id,
      familyId: json.familyId,
      spouse1Id: json.spouse1Id,
      spouse2Id: json.spouse2Id,

      // STUBBED DATA: Service Layer must populate names/genders via FamilyMember Repository
      spouse1: {
        id: json.spouse1Id,
        name: 'Pending Load...',
        gender: 'UNKNOWN',
        isDeceased: false,
      },
      spouse2: {
        id: json.spouse2Id,
        name: 'Pending Load...',
        gender: 'UNKNOWN',
        isDeceased: false,
      },

      type: json.type,

      details: {
        // Use marriageType from dates VO or root type
        type: dates.marriageType || json.type,
        status: getMarriageStatus(),
        isPolygamous: toBoolean(details.isPolygamous) || json.isPolygamousUnderS40,
        polygamousHouseId: details.polygamousHouseId || json.polygamousHouseId,
        isEnded,
        endReason: json.endReason,

        // Legal Registration
        registrationNumber: json.registrationNumber,
        issuingAuthority: json.issuingAuthority,
        certificateIssueDate: toDateIfExists(json.certificateIssueDate),
        registrationDistrict: json.registrationDistrict,
        s40CertificateNumber: json.s40CertificateNumber,

        isMatrimonialPropertyRegime: toBoolean(json.isMatrimonialPropertyRegime),
        matrimonialPropertySettled: toBoolean(json.matrimonialPropertySettled),

        // Customary details
        customaryType: customary?.customaryType,
        dowryPaid: bridePrice?.status === 'FULLY_PAID' || bridePrice?.status === 'PARTIALLY_PAID',
        dowryAmount: totalAmountAgreed > 0 ? totalAmountAgreed : undefined,
        dowryCurrency: bridePrice?.currency,

        // Islamic details
        nikahDate: toDateIfExists(islamic?.nikahDate),
        mahrAmount: islamic?.mahrAmount,
        mahrCurrency: islamic?.mahrCurrency,
        waliName: islamic?.waliName,

        isValidUnderKenyanLaw: toBoolean(json.isValidUnderKenyanLaw),
        invalidityReason: json.invalidityReason,
      },

      dates: {
        marriageDate: toDate(dates.marriageDate),
        registrationDate: toDateIfExists(dates.registrationDate),
        // Map from polygamousHouseEstablishmentDate
        polygamousHouseDate: toDateIfExists(dates.polygamousHouseEstablishmentDate),
        dissolutionDate: toDateIfExists(dates.dissolutionDate),
        durationYears: dates.marriageDurationYears ?? 0,
        durationMonths: (dates.marriageDurationYears ?? 0) * 12,
      },

      bridePrice: bridePrice
        ? {
            totalAmount: totalAmountAgreed,
            currency: bridePrice.currency || 'KES',
            status: getBridePriceStatus(bridePrice),
            isPaid: getBridePriceStatus(bridePrice) === 'FULLY_PAID',
            payments: Array.isArray(bridePrice.payments)
              ? bridePrice.payments.map((p: any) => ({
                  type: p.type,
                  totalValue: p.totalValue,
                  currency: p.currency,
                  description: p.description,
                  date: toDate(p.date), // Use toDate to ensure Date, not undefined
                  paidAmount: p.totalValue,
                  outstandingAmount: 0, // Each payment is considered paid
                }))
              : [],
            totalPaid,
            totalOutstanding,
          }
        : undefined,

      customaryMarriage: customary
        ? {
            ethnicGroup: customary.ethnicGroup,
            customaryType: customary.customaryType,
            ceremonyDate: toDate(customary.ceremonyDate),
            ceremonyLocation: toStringOrDefault(customary.ceremonyLocation),
            clanApproval: toBoolean(customary.clanApproval),
            clanApprovalDate: toDateIfExists(customary.clanApprovalDate),
            familyConsent: toBoolean(customary.familyConsent),
            familyConsentDate: toDateIfExists(customary.familyConsentDate),
            elderWitnesses: Array.isArray(customary.elderWitnesses)
              ? customary.elderWitnesses.map((w: any) => ({
                  name: toStringOrDefault(w.name),
                  age: w.age || 0,
                  relationship: toStringOrDefault(w.relationship),
                }))
              : [],
            isDissolved: toBoolean(customary.isDissolved),
            dissolutionDate: toDateIfExists(customary.dissolutionDate),
            dissolutionReason: customary.dissolutionReason,
          }
        : undefined,

      islamicMarriage: islamic
        ? {
            nikahDate: toDate(islamic.nikahDate),
            nikahLocation: toStringOrDefault(islamic.nikahLocation),
            imamName: toStringOrDefault(islamic.imamName),
            waliName: toStringOrDefault(islamic.waliName),
            mahrAmount: islamic.mahrAmount || 0,
            mahrCurrency: islamic.mahrCurrency || 'KES',
            mahrStatus: getMahrStatus(islamic),
            talaqIssued: toBoolean(islamic.talaqIssued),
            talaqDate: toDateIfExists(islamic.talaqDate),
            talaqType: islamic.talaqType,
            talaqCount: islamic.talaqCount || 0,
          }
        : undefined,

      deceasedSpouseId: json.deceasedSpouseId,
      divorceDecreeNumber: json.divorceDecreeNumber,
      divorceCourt: json.divorceCourt,
      divorceDate: toDateIfExists(json.divorceDate),

      separationDate: toDateIfExists(json.separationDate),
      separationReason: json.separationReason,
      maintenanceOrderIssued: toBoolean(json.maintenanceOrderIssued),
      maintenanceOrderNumber: json.maintenanceOrderNumber,
      courtValidationDate: toDateIfExists(json.courtValidationDate),

      spouse1MaritalStatusAtMarriage: json.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: json.spouse2MaritalStatusAtMarriage,

      isActive: toBoolean(json.isActive),
      endReason: json.endReason || MarriageEndReason.STILL_ACTIVE,

      isPolygamousUnderS40: toBoolean(json.isPolygamousUnderS40),
      polygamousHouseId: json.polygamousHouseId,
      polygamousHouseName: undefined,

      hasMatrimonialProperty:
        toBoolean(json.isMatrimonialPropertyRegime) && !toBoolean(json.matrimonialPropertySettled),

      isIslamic: json.type === MarriageType.ISLAMIC,
      isCustomary: json.type === MarriageType.CUSTOMARY || json.type === MarriageType.TRADITIONAL,

      isSpouseDependant:
        toBoolean(json.isActive) || json.endReason === MarriageEndReason.STILL_ACTIVE,

      complianceStatus: this.calculateComplianceStatus(json),

      childrenCount: 0,
      childrenIds: [],

      legalNotes: this.generateLegalNotes(json),

      version: json.version || 1,
      createdAt: toDate(json.createdAt),
      updatedAt: toDate(json.updatedAt),
    };
  }

  // --- Helpers ---

  private calculateComplianceStatus(json: any): string {
    if (json.isValidUnderKenyanLaw === false) return 'NON_COMPLIANT';
    if (json.isPolygamousUnderS40 && !json.s40CertificateNumber) return 'NON_COMPLIANT';
    // Registration check for Civil
    if (json.type === MarriageType.CIVIL && !json.registrationNumber) return 'PENDING';
    return 'COMPLIANT';
  }

  private generateLegalNotes(json: any): string[] {
    const notes: string[] = [];
    if (json.type === MarriageType.CIVIL) {
      notes.push(
        json.registrationNumber ? `Registered: ${json.registrationNumber}` : 'Registration Pending',
      );
    }
    if (json.isPolygamousUnderS40) {
      notes.push('S.40 Polygamy Act Applicable');
    }
    if (json.endReason && json.endReason !== 'STILL_ACTIVE') {
      notes.push(`Terminated: ${json.endReason}`);
    }
    return notes;
  }

  toDomainList(dtos: any[]): Marriage[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(marriages: Marriage[]): MarriageResponse[] {
    return marriages.map((marriage) => this.toDTO(marriage));
  }
}
