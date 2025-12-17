// application/family/mappers/marriage.mapper.ts
import { Injectable } from '@nestjs/common';
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { Marriage } from '../../../domain/entities/marriage.entity';
import { RegisterMarriageRequest } from '../dto/request/register-marriage.request';
import { MarriageResponse } from '../dto/response/marriage.response';
import { BaseMapper } from './base.mapper';

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
      details: dto.details, // This should be MarriageDetails VO
      dates: dto.dates, // This should be KenyanMarriageDates VO
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
      isMatrimonialPropertyRegime: dto.isMatrimonialPropertyRegime || true,
      matrimonialPropertySettled: dto.matrimonialPropertySettled || false,
      spouse1MaritalStatusAtMarriage: dto.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: dto.spouse2MaritalStatusAtMarriage,
      separationDate: dto.separationDate ? new Date(dto.separationDate) : undefined,
      separationReason: dto.separationReason,
      maintenanceOrderIssued: dto.maintenanceOrderIssued || false,
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
    const marriageJSON = marriage.toJSON();
    const detailsJSON = marriageJSON.details;
    const datesJSON = marriageJSON.dates;
    const bridePriceJSON = marriageJSON.bridePrice;
    const customaryMarriageJSON = marriageJSON.customaryMarriage;
    const islamicMarriageJSON = marriageJSON.islamicMarriage;

    return {
      id: marriageJSON.id,
      familyId: marriageJSON.familyId,
      spouse1Id: marriageJSON.spouse1Id,
      spouse2Id: marriageJSON.spouse2Id,
      spouse1: {
        id: marriageJSON.spouse1Id,
        name: '', // To be populated by service
        gender: '', // To be populated by service
        isDeceased: false, // To be populated by service
      },
      spouse2: {
        id: marriageJSON.spouse2Id,
        name: '', // To be populated by service
        gender: '', // To be populated by service
        isDeceased: false, // To be populated by service
      },
      type: marriageJSON.type,
      details: {
        type: detailsJSON.type,
        status: detailsJSON.status,
        isPolygamous: detailsJSON.isPolygamous,
        polygamousHouseId: detailsJSON.polygamousHouseId,
        isEnded: detailsJSON.isEnded,
        endReason: detailsJSON.endReason,
        registrationNumber: detailsJSON.registrationNumber,
        issuingAuthority: detailsJSON.issuingAuthority,
        certificateIssueDate: detailsJSON.certificateIssueDate,
        registrationDistrict: detailsJSON.registrationDistrict,
        s40CertificateNumber: detailsJSON.s40CertificateNumber,
        isMatrimonialPropertyRegime: detailsJSON.isMatrimonialPropertyRegime,
        matrimonialPropertySettled: detailsJSON.matrimonialPropertySettled,
        customaryType: detailsJSON.customaryType,
        dowryPaid: detailsJSON.dowryPaid,
        dowryAmount: detailsJSON.dowryAmount,
        dowryCurrency: detailsJSON.dowryCurrency,
        nikahDate: detailsJSON.nikahDate,
        mahrAmount: detailsJSON.mahrAmount,
        mahrCurrency: detailsJSON.mahrCurrency,
        waliName: detailsJSON.waliName,
        isValidUnderKenyanLaw: detailsJSON.isValidUnderKenyanLaw,
        invalidityReason: detailsJSON.invalidityReason,
      },
      dates: {
        marriageDate: datesJSON.marriageDate,
        registrationDate: datesJSON.registrationDate,
        polygamousHouseDate: datesJSON.polygamousHouseDate,
        dissolutionDate: datesJSON.dissolutionDate,
        durationYears: datesJSON.durationYears,
        durationMonths: datesJSON.durationMonths,
      },
      bridePrice: bridePriceJSON
        ? {
            totalAmount: bridePriceJSON.totalAmount,
            currency: bridePriceJSON.currency,
            status: bridePriceJSON.status,
            isPaid: bridePriceJSON.isPaid,
            payments:
              bridePriceJSON.payments?.map((payment) => ({
                type: payment.type,
                totalValue: payment.totalValue,
                currency: payment.currency,
                description: payment.description,
                date: payment.date,
                paidAmount: payment.paidAmount,
                outstandingAmount: payment.outstandingAmount,
              })) || [],
            totalPaid: bridePriceJSON.totalPaid,
            totalOutstanding: bridePriceJSON.totalOutstanding,
          }
        : undefined,
      customaryMarriage: customaryMarriageJSON
        ? {
            ethnicGroup: customaryMarriageJSON.ethnicGroup,
            customaryType: customaryMarriageJSON.customaryType,
            ceremonyDate: customaryMarriageJSON.ceremonyDate,
            ceremonyLocation: customaryMarriageJSON.ceremonyLocation,
            clanApproval: customaryMarriageJSON.clanApproval,
            clanApprovalDate: customaryMarriageJSON.clanApprovalDate,
            familyConsent: customaryMarriageJSON.familyConsent,
            familyConsentDate: customaryMarriageJSON.familyConsentDate,
            elderWitnesses:
              customaryMarriageJSON.elderWitnesses?.map((witness) => ({
                name: witness.name,
                age: witness.age,
                relationship: witness.relationship,
              })) || [],
            isDissolved: customaryMarriageJSON.isDissolved,
            dissolutionDate: customaryMarriageJSON.dissolutionDate,
            dissolutionReason: customaryMarriageJSON.dissolutionReason,
          }
        : undefined,
      islamicMarriage: islamicMarriageJSON
        ? {
            nikahDate: islamicMarriageJSON.nikahDate,
            nikahLocation: islamicMarriageJSON.nikahLocation,
            imamName: islamicMarriageJSON.imamName,
            waliName: islamicMarriageJSON.waliName,
            mahrAmount: islamicMarriageJSON.mahrAmount,
            mahrCurrency: islamicMarriageJSON.mahrCurrency,
            mahrStatus: islamicMarriageJSON.mahrStatus,
            talaqIssued: islamicMarriageJSON.talaqIssued,
            talaqDate: islamicMarriageJSON.talaqDate,
            talaqType: islamicMarriageJSON.talaqType,
            talaqCount: islamicMarriageJSON.talaqCount,
          }
        : undefined,
      deceasedSpouseId: marriageJSON.deceasedSpouseId,
      divorceDecreeNumber: marriageJSON.divorceDecreeNumber,
      divorceCourt: marriageJSON.divorceCourt,
      divorceDate: marriageJSON.divorceDate,
      separationDate: marriageJSON.separationDate,
      separationReason: marriageJSON.separationReason,
      maintenanceOrderIssued: marriageJSON.maintenanceOrderIssued,
      maintenanceOrderNumber: marriageJSON.maintenanceOrderNumber,
      courtValidationDate: marriageJSON.courtValidationDate,
      spouse1MaritalStatusAtMarriage: marriageJSON.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: marriageJSON.spouse2MaritalStatusAtMarriage,
      isActive: marriageJSON.isActive,
      endReason: marriageJSON.endReason,
      isPolygamousUnderS40: marriageJSON.isPolygamousUnderS40,
      polygamousHouseId: marriageJSON.polygamousHouseId,
      polygamousHouseName: '', // To be populated by service
      hasMatrimonialProperty:
        marriageJSON.isMatrimonialPropertyRegime && !marriageJSON.matrimonialPropertySettled,
      isIslamic: marriageJSON.type === MarriageType.ISLAMIC,
      isCustomary:
        marriageJSON.type === MarriageType.CUSTOMARY ||
        marriageJSON.type === MarriageType.TRADITIONAL,
      isSpouseDependant:
        marriageJSON.isActive || marriageJSON.endReason === MarriageEndReason.STILL_ACTIVE,
      complianceStatus: this.calculateComplianceStatus(marriageJSON),
      childrenCount: 0, // To be populated by service
      childrenIds: [], // To be populated by service
      legalNotes: this.generateLegalNotes(marriageJSON),
      version: marriageJSON.version,
      createdAt: marriageJSON.createdAt,
      updatedAt: marriageJSON.updatedAt,
    };
  }

  toDomainList(dtos: any[]): Marriage[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(marriages: Marriage[]): MarriageResponse[] {
    return marriages.map((marriage) => this.toDTO(marriage));
  }

  // Helper methods
  private calculateComplianceStatus(marriageJSON: any): string {
    if (!marriageJSON.isValidUnderKenyanLaw) {
      return 'NON_COMPLIANT';
    }

    if (marriageJSON.isPolygamousUnderS40 && !marriageJSON.s40CertificateNumber) {
      return 'NON_COMPLIANT';
    }

    if (marriageJSON.type === MarriageType.CIVIL && !marriageJSON.registrationNumber) {
      return 'PENDING';
    }

    return 'COMPLIANT';
  }

  private generateLegalNotes(marriageJSON: any): string[] {
    const notes: string[] = [];

    if (marriageJSON.type === MarriageType.CIVIL) {
      if (marriageJSON.registrationNumber) {
        notes.push(
          `Civil marriage registered with ${marriageJSON.issuingAuthority || 'authorities'}`,
        );
      } else {
        notes.push('Civil marriage pending registration');
      }
    }

    if (marriageJSON.type === MarriageType.ISLAMIC) {
      notes.push('Islamic marriage governed by Islamic law');
      if (marriageJSON.islamicMarriage?.mahrAmount) {
        notes.push(
          `Mahr amount: ${marriageJSON.islamicMarriage.mahrAmount} ${marriageJSON.islamicMarriage.mahrCurrency || 'KES'}`,
        );
      }
    }

    if (
      marriageJSON.type === MarriageType.CUSTOMARY ||
      marriageJSON.type === MarriageType.TRADITIONAL
    ) {
      notes.push('Customary marriage recognized under Kenyan law');
      if (marriageJSON.customaryMarriage?.clanApproval) {
        notes.push('Clan approval obtained');
      }
      if (marriageJSON.customaryMarriage?.familyConsent) {
        notes.push('Family consent obtained');
      }
    }

    if (marriageJSON.isPolygamousUnderS40) {
      notes.push('Polygamous marriage under S.40 Law of Succession Act');
      if (marriageJSON.s40CertificateNumber) {
        notes.push(`Court certified: ${marriageJSON.s40CertificateNumber}`);
      }
    }

    if (marriageJSON.endReason !== MarriageEndReason.STILL_ACTIVE) {
      notes.push(`Marriage ended: ${marriageJSON.endReason}`);
    }

    return notes;
  }

  // For summary views
  toSummaryDTO(marriage: Marriage) {
    const marriageJSON = marriage.toJSON();

    return {
      id: marriageJSON.id,
      spouse1Id: marriageJSON.spouse1Id,
      spouse2Id: marriageJSON.spouse2Id,
      type: marriageJSON.type,
      startDate: marriageJSON.dates.marriageDate,
      isActive: marriageJSON.isActive,
      isPolygamous: marriageJSON.isPolygamousUnderS40,
      polygamousHouseId: marriageJSON.polygamousHouseId,
      lastUpdated: marriageJSON.updatedAt,
    };
  }
}
