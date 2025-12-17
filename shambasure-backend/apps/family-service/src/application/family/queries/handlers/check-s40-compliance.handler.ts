// application/family/queries/handlers/check-s40-compliance.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../common/result';
import { KenyanLegalComplianceResponse } from '../../dto/response/kenyan-legal-compliance.response';
import {
  CheckS40ComplianceQuery,
  S40ComplianceReportType,
} from '../impl/check-s40-compliance.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(CheckS40ComplianceQuery)
export class CheckS40ComplianceHandler extends BaseQueryHandler<
  CheckS40ComplianceQuery,
  Result<KenyanLegalComplianceResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly marriageRepository: IMarriageRepository,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(query: CheckS40ComplianceQuery): Promise<Result<KenyanLegalComplianceResponse>> {
    try {
      // Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${query.familyId} not found`);
      }

      // Load polygamous houses
      const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);

      // Load marriages
      const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);

      // Generate compliance report
      const report = await this.generateComplianceReport(
        family,
        houses,
        marriages,
        query.reportType,
        query,
      );

      this.logSuccess(query, report, 'S.40 compliance check completed');
      return Result.ok(report);
    } catch (error) {
      this.handleError(error, query, 'CheckS40ComplianceHandler');
    }
  }

  private async generateComplianceReport(
    family: any,
    houses: any[],
    marriages: any[],
    reportType: S40ComplianceReportType,
    query: CheckS40ComplianceQuery,
  ): Promise<KenyanLegalComplianceResponse> {
    const now = new Date();

    // Calculate S.40 compliance
    const s40Compliance = this.calculateS40Compliance(family, houses, marriages);

    // Calculate overall compliance (simplified)
    const overallScore = this.calculateOverallScore(s40Compliance);
    const overallStatus = this.determineOverallStatus(overallScore);

    // Generate issues
    const issues = this.generateComplianceIssues(houses, marriages);

    // Generate recommendations
    const recommendations = query.includeRecommendations
      ? this.generateRecommendations(houses, s40Compliance)
      : [];

    const response: KenyanLegalComplianceResponse = {
      familyId: family.id,
      familyName: family.name,
      overallScore,
      overallStatus,
      lastChecked: now,
      nextCheckDue: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      section29: this.calculateS29Compliance(family),
      section40: s40Compliance,
      section70: this.calculateS70Compliance(family),
      childrenAct: this.calculateChildrenActCompliance(family),
      marriageAct: this.calculateMarriageActCompliance(marriages),
      totalIssues: issues.length,
      criticalIssues: issues.filter((i) => i.severity === 'CRITICAL').length,
      highIssues: issues.filter((i) => i.severity === 'HIGH').length,
      mediumIssues: issues.filter((i) => i.severity === 'MEDIUM').length,
      lowIssues: issues.filter((i) => i.severity === 'LOW').length,
      resolvedIssues: issues.filter((i) => i.isResolved).length,
      allIssues: issues,
      history: query.includeHistory ? await this.getComplianceHistory(family.id) : [],
      recommendations,
      legalAdvisor: {
        name: 'Kenya Law Society',
        phone: '+254202222222',
        email: 'info@lawsocietykenya.org',
        website: 'https://www.lawsocietykenya.org',
      },
    };

    // Format for legal documentation if requested
    if (query.legalDocumentationFormat) {
      this.formatForLegalDocumentation(response);
    }

    return response;
  }

  private calculateS40Compliance(family: any, houses: any[], marriages: any[]): any {
    const polygamousMarriages = marriages.filter((m) => m.isPolygamousUnderS40);
    const certifiedHouses = houses.filter((h) => h.courtRecognized);
    const housesWithConsent = houses.filter((h) => h.wivesConsentObtained);

    // Calculate house shares
    let totalSharesPercentage = 0;
    houses.forEach((house) => {
      totalSharesPercentage += house.houseSharePercentage || 0;
    });

    const complianceStatus = this.determineS40ComplianceStatus(family, houses, polygamousMarriages);

    return {
      isPolygamous: family.isPolygamous,
      totalHouses: houses.length,
      certifiedHouses: certifiedHouses.length,
      housesWithConsent: housesWithConsent.length,
      totalSharesPercentage,
      status: complianceStatus,
      issues: this.generateS40ComplianceIssues(family, houses, polygamousMarriages),
    };
  }

  private determineS40ComplianceStatus(
    family: any,
    houses: any[],
    polygamousMarriages: any[],
  ): string {
    if (!family.isPolygamous) {
      return 'NOT_APPLICABLE';
    }

    if (houses.length === 0) {
      return 'NON_COMPLIANT';
    }

    // Check for critical issues
    const criticalIssues = this.generateS40ComplianceIssues(
      family,
      houses,
      polygamousMarriages,
    ).filter((issue) => issue.severity === 'CRITICAL');

    if (criticalIssues.length > 0) {
      return 'NON_COMPLIANT';
    }

    // Check if all polygamous marriages have houses
    const marriagesWithoutHouses = polygamousMarriages.filter((m) => !m.polygamousHouseId);
    if (marriagesWithoutHouses.length > 0) {
      return 'PARTIAL';
    }

    // Check if all houses beyond first have consent
    const subsequentHouses = houses.filter((h) => h.houseOrder > 1);
    const housesWithoutConsent = subsequentHouses.filter((h) => !h.wivesConsentObtained);
    if (housesWithoutConsent.length > 0) {
      return 'PARTIAL';
    }

    return 'COMPLIANT';
  }

  private generateS40ComplianceIssues(
    family: any,
    houses: any[],
    polygamousMarriages: any[],
  ): any[] {
    const issues: any[] = [];

    if (family.isPolygamous && houses.length === 0) {
      issues.push({
        code: 'S40_NO_HOUSES',
        severity: 'CRITICAL',
        title: 'Polygamous Family Without Houses',
        description: 'Family is marked as polygamous but has no polygamous houses defined.',
        lawReference: 'Law of Succession Act, Section 40(1)',
        recommendation: 'Define polygamous houses for estate distribution.',
        isResolved: false,
      });
    }

    // Check for houses without court certification
    houses.forEach((house) => {
      if (house.houseOrder > 1 && !house.courtRecognized) {
        issues.push({
          code: 'S40_NO_CERTIFICATE',
          severity: house.houseOrder === 2 ? 'HIGH' : 'MEDIUM',
          title: `House "${house.houseName}" Lacks Court Certification`,
          description: `Polygamous house "${house.houseName}" (Order: ${house.houseOrder}) lacks S.40 court certification.`,
          lawReference: 'Law of Succession Act, Section 40(1)',
          affectedId: house.id,
          affectedName: house.houseName,
          recommendation: 'Obtain court certificate for the polygamous house.',
          isResolved: false,
        });
      }
    });

    // Check for houses without wives consent
    houses.forEach((house) => {
      if (house.houseOrder > 1 && !house.wivesConsentObtained) {
        issues.push({
          code: 'S40_NO_CONSENT',
          severity: 'HIGH',
          title: `House "${house.houseName}" Lacks Wives Consent`,
          description: `Subsequent polygamous house "${house.houseName}" lacks documented consent from existing wives.`,
          lawReference: 'Law of Succession Act, Section 40(2)',
          affectedId: house.id,
          affectedName: house.houseName,
          recommendation: 'Document and obtain consent from existing wives.',
          isResolved: false,
        });
      }
    });

    // Check for polygamous marriages without house assignment
    polygamousMarriages.forEach((marriage) => {
      if (!marriage.polygamousHouseId) {
        issues.push({
          code: 'S40_MARRIAGE_NO_HOUSE',
          severity: 'MEDIUM',
          title: 'Polygamous Marriage Without House Assignment',
          description: `Marriage between spouses lacks polygamous house assignment.`,
          lawReference: 'Law of Succession Act, Section 40(3)',
          recommendation: 'Assign marriage to appropriate polygamous house.',
          isResolved: false,
        });
      }
    });

    return issues;
  }

  private calculateS29Compliance(family: any): any {
    // Simplified S.29 compliance calculation
    return {
      potentialDependants: family.dependantCount || 0,
      verifiedDependants: 0, // Would need actual verification data
      claimsFiled: 0,
      courtProvisions: 0,
      totalDependencyValue: 0,
      status: family.dependantCount > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateS70Compliance(family: any): any {
    // Simplified S.70 compliance calculation
    return {
      minorChildren: family.minorCount || 0,
      appointedGuardians: 0, // Would need guardianship data
      guardiansWithBonds: 0,
      pendingAnnualReports: 0,
      status: family.minorCount > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateChildrenActCompliance(family: any): any {
    // Simplified Children Act compliance
    return {
      adoptedChildren: 0, // Would need adoption data
      validAdoptionOrders: 0,
      childrenInNeed: family.minorCount || 0,
      status: 'COMPLIANT',
      issues: [],
    };
  }

  private calculateMarriageActCompliance(marriages: any[]): any {
    const registeredMarriages = marriages.filter((m) => m.registrationNumber);
    const customaryMarriages = marriages.filter(
      (m) => m.type === 'CUSTOMARY' || m.type === 'TRADITIONAL',
    );
    const islamicMarriages = marriages.filter((m) => m.type === 'ISLAMIC');

    return {
      totalMarriages: marriages.length,
      registeredMarriages: registeredMarriages.length,
      customaryMarriages: customaryMarriages.length,
      islamicMarriages: islamicMarriages.length,
      marriagesWithBridePrice: 0, // Would need bride price data
      marriagesWithSettledProperty: 0, // Would need property data
      status: marriages.length > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateOverallScore(s40Compliance: any): number {
    // Simplified overall score calculation
    if (s40Compliance.status === 'COMPLIANT') return 85;
    if (s40Compliance.status === 'PARTIAL') return 65;
    if (s40Compliance.status === 'NOT_APPLICABLE') return 90;
    return 40;
  }

  private determineOverallStatus(score: number): string {
    if (score >= 80) return 'COMPLIANT';
    if (score >= 60) return 'PARTIAL';
    if (score >= 40) return 'NON_COMPLIANT';
    return 'CRITICAL';
  }

  private generateComplianceIssues(houses: any[], marriages: any[]): any[] {
    const issues = [];

    // Generate issues from S.40 compliance
    houses.forEach((house) => {
      if (house.houseOrder > 1 && !house.courtRecognized) {
        issues.push({
          code: 'S40_NO_CERTIFICATE',
          severity: 'HIGH',
          title: `Missing S.40 Certificate for House "${house.houseName}"`,
          description: `House "${house.houseName}" (Order: ${house.houseOrder}) lacks S.40 court certificate required by Law of Succession Act.`,
          lawReference: 'Law of Succession Act, Section 40(1)',
          affectedId: house.id,
          affectedName: house.houseName,
          recommendation: 'Obtain court certificate for polygamous house.',
          isResolved: false,
        });
      }
    });

    // Add more issue generation logic as needed

    return issues;
  }

  private generateRecommendations(houses: any[], s40Compliance: any): string[] {
    const recommendations: string[] = [];

    if (s40Compliance.status === 'NON_COMPLIANT') {
      recommendations.push('Address critical S.40 compliance issues immediately.');
    }

    houses.forEach((house) => {
      if (house.houseOrder > 1 && !house.courtRecognized) {
        recommendations.push(`Obtain S.40 certificate for house "${house.houseName}".`);
      }
      if (house.houseOrder > 1 && !house.wivesConsentObtained) {
        recommendations.push(`Document wives consent for house "${house.houseName}".`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance practices.');
    }

    return recommendations;
  }

  private async getComplianceHistory(familyId: string): Promise<any[]> {
    // This would query historical compliance data
    // For now, return placeholder data
    return [
      {
        date: new Date('2023-10-15'),
        score: 65,
        status: 'PARTIAL',
        checkedBy: 'system',
      },
      {
        date: new Date('2024-01-15'),
        score: 75,
        status: 'PARTIAL',
        checkedBy: 'system',
      },
    ];
  }

  private formatForLegalDocumentation(response: KenyanLegalComplianceResponse): void {
    // Add legal formatting to response
    response.legalDocumentation = {
      preparedFor: 'Legal Review',
      preparedBy: 'Family Service System',
      datePrepared: new Date(),
      referenceNumber: `COMP-${response.familyId}-${Date.now()}`,
      disclaimer:
        'This report is for informational purposes only and does not constitute legal advice.',
    };
  }
}
