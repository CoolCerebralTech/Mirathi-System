// application/family/mappers/polygamous-house.mapper.ts
import { Injectable } from '@nestjs/common';

import { PolygamousHouse } from '../../../domain/entities/polygamous-house.entity';
import { AddPolygamousHouseRequest } from '../dto/request/add-polygamous-house.request';
import { PolygamousHouseResponse } from '../dto/response/polygamous-house.response';
import { BaseMapper } from './base.mapper';

@Injectable()
export class PolygamousHouseMapper extends BaseMapper<PolygamousHouse, PolygamousHouseResponse> {
  toCreatePolygamousHouseProps(request: AddPolygamousHouseRequest) {
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

  toDomain(dto: any): PolygamousHouse {
    const props = {
      id: dto.id,
      familyId: dto.familyId,
      houseHeadId: dto.houseHeadId,
      houseName: dto.houseName,
      houseOrder: dto.houseOrder,
      establishedDate: new Date(dto.establishedDate),
      courtRecognized: dto.courtRecognized || false,
      courtOrderNumber: dto.courtOrderNumber,
      s40CertificateNumber: dto.s40CertificateNumber,
      certificateIssuedDate: dto.certificateIssuedDate
        ? new Date(dto.certificateIssuedDate)
        : undefined,
      certificateIssuingCourt: dto.certificateIssuingCourt,
      houseSharePercentage: dto.houseSharePercentage,
      houseBusinessName: dto.houseBusinessName,
      houseBusinessKraPin: dto.houseBusinessKraPin,
      separateProperty: dto.separateProperty || false,
      wivesConsentObtained: dto.wivesConsentObtained || false,
      wivesConsentDocument: dto.wivesConsentDocument,
      wivesAgreementDetails: dto.wivesAgreementDetails,
      successionInstructions: dto.successionInstructions,
      houseDissolvedAt: dto.houseDissolvedAt ? new Date(dto.houseDissolvedAt) : undefined,
      houseAssetsFrozen: dto.houseAssetsFrozen || false,
      version: dto.version || 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };

    return PolygamousHouse.createFromProps(props);
  }

  toDTO(polygamousHouse: PolygamousHouse): PolygamousHouseResponse {
    const houseJSON = polygamousHouse.toJSON();

    return {
      id: houseJSON.id,
      familyId: houseJSON.familyId,
      houseName: houseJSON.houseName,
      houseOrder: houseJSON.houseOrder,
      establishedDate: houseJSON.establishedDate,
      houseHead: houseJSON.houseHeadId
        ? {
            id: houseJSON.houseHeadId,
            name: '', // To be populated by service
            gender: '', // To be populated by service
            isDeceased: false, // To be populated by service
            age: 0, // To be populated by service
            isIdentityVerified: false, // To be populated by service
          }
        : undefined,
      houseHeadId: houseJSON.houseHeadId,
      courtRecognized: houseJSON.courtRecognized,
      courtOrderNumber: houseJSON.courtOrderNumber,
      s40CertificateNumber: houseJSON.s40CertificateNumber,
      certificateIssuedDate: houseJSON.certificateIssuedDate,
      certificateIssuingCourt: houseJSON.certificateIssuingCourt,
      houseSharePercentage: houseJSON.houseSharePercentage,
      business: houseJSON.houseBusinessName
        ? {
            name: houseJSON.houseBusinessName,
            kraPin: houseJSON.houseBusinessKraPin || '',
            industry: '', // Would need additional field
            estimatedValue: 0, // Would need additional field
            currency: 'KES',
          }
        : undefined,
      separateProperty: houseJSON.separateProperty,
      wivesConsentObtained: houseJSON.wivesConsentObtained,
      wivesConsentDocument: houseJSON.wivesConsentDocument,
      wivesAgreementDetails: houseJSON.wivesAgreementDetails,
      successionInstructions: houseJSON.successionInstructions
        ? {
            method: 'PRIMOGENITURE', // Default, should be derived from instructions
            instructions: houseJSON.successionInstructions,
            lastUpdated: houseJSON.updatedAt,
          }
        : undefined,
      houseDissolvedAt: houseJSON.houseDissolvedAt,
      houseAssetsFrozen: houseJSON.houseAssetsFrozen,
      memberCount: 0, // To be populated by service
      marriageCount: 0, // To be populated by service
      childrenCount: 0, // To be populated by service
      minorCount: 0, // To be populated by service
      members: [], // To be populated by service
      marriages: [], // To be populated by service
      assets: [], // To be populated by service
      totalAssetValue: 0, // To be populated by service
      monthlyIncome: 0, // To be populated by service
      monthlyExpenses: 0, // To be populated by service
      isDissolved: houseJSON.isDissolved,
      s40ComplianceStatus: houseJSON.s40ComplianceStatus,
      complianceNotes: this.generateComplianceNotes(houseJSON),
      history: this.generateHouseHistory(houseJSON),
      version: houseJSON.version,
      createdAt: houseJSON.createdAt,
      updatedAt: houseJSON.updatedAt,
      metrics: {
        yearsActive: this.calculateYearsActive(houseJSON.establishedDate),
        averageMemberAge: 0, // To be populated by service
        educationLevel: 'UNKNOWN', // To be populated by service
        employmentRate: 0, // To be populated by service
        dependencyRatio: 0, // To be populated by service
      },
    };
  }

  toDomainList(dtos: any[]): PolygamousHouse[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(houses: PolygamousHouse[]): PolygamousHouseResponse[] {
    return houses.map((house) => this.toDTO(house));
  }

  // Helper methods
  private generateComplianceNotes(houseJSON: any): string[] {
    const notes: string[] = [];

    if (houseJSON.courtRecognized) {
      notes.push(`Court recognized under S.40 (Certificate: ${houseJSON.s40CertificateNumber})`);
    } else if (houseJSON.houseOrder > 1) {
      notes.push('Warning: Subsequent polygamous house without court recognition');
    }

    if (houseJSON.wivesConsentObtained) {
      notes.push('Wives consent documented');
    } else if (houseJSON.houseOrder > 1) {
      notes.push('Warning: Missing wives consent for subsequent house');
    }

    if (houseJSON.houseSharePercentage) {
      notes.push(`House share percentage set at ${houseJSON.houseSharePercentage}%`);
    }

    if (houseJSON.separateProperty) {
      notes.push('House maintains separate property');
    }

    if (houseJSON.isDissolved) {
      notes.push(`House dissolved on ${houseJSON.houseDissolvedAt}`);
    }

    if (houseJSON.houseAssetsFrozen) {
      notes.push('House assets are currently frozen');
    }

    return notes;
  }

  private generateHouseHistory(houseJSON: any): string[] {
    const history: string[] = [];

    history.push(
      `House "${houseJSON.houseName}" established on ${houseJSON.establishedDate.toDateString()}`,
    );

    if (houseJSON.certificateIssuedDate) {
      history.push(`Court certified on ${houseJSON.certificateIssuedDate.toDateString()}`);
    }

    if (houseJSON.houseBusinessName) {
      history.push(`Business "${houseJSON.houseBusinessName}" registered`);
    }

    if (houseJSON.houseDissolvedAt) {
      history.push(`House dissolved on ${houseJSON.houseDissolvedAt.toDateString()}`);
    }

    return history;
  }

  private calculateYearsActive(establishedDate: Date): number {
    const now = new Date();
    const diffInMs = now.getTime() - establishedDate.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffInYears);
  }

  // For summary views
  toSummaryDTO(polygamousHouse: PolygamousHouse) {
    const houseJSON = polygamousHouse.toJSON();

    return {
      id: houseJSON.id,
      houseName: houseJSON.houseName,
      houseOrder: houseJSON.houseOrder,
      houseHeadId: houseJSON.houseHeadId,
      establishedDate: houseJSON.establishedDate,
      courtRecognized: houseJSON.courtRecognized,
      isDissolved: houseJSON.isDissolved,
      s40ComplianceStatus: houseJSON.s40ComplianceStatus,
      lastUpdated: houseJSON.updatedAt,
    };
  }
}
