import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { Marriage } from '../../../../domain/entities/marriage.entity';
import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import type { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../../common/base/result';
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
  KenyanLegalComplianceResponse
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly marriageRepository: IMarriageRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: CheckS40ComplianceQuery): Promise<Result<KenyanLegalComplianceResponse>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Aggregates
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${query.familyId} not found`));
      }

      const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);
      const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);

      // 2. Generate Report (Synchronous call)
      const report = this.generateComplianceReport(
        family,
        houses,
        marriages,
        query.reportType || S40ComplianceReportType.SUMMARY,
        query,
      );

      this.logSuccess(query, report, 'S.40 compliance check completed');
      return Result.ok(report);
    } catch (error) {
      this.handleError(error, query, 'CheckS40ComplianceHandler');
    }
  }

  private generateComplianceReport(
    family: Family,
    houses: PolygamousHouse[],
    marriages: Marriage[],
    reportType: S40ComplianceReportType,
    query: CheckS40ComplianceQuery,
  ): KenyanLegalComplianceResponse {
    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + 90); // Quarterly compliance check

    const s40Compliance = this.calculateS40Compliance(family, houses, marriages);
    const overallScore = this.calculateOverallScore(s40Compliance);
    const overallStatus = this.determineOverallStatus(overallScore);
    const issues = this.generateComplianceIssues(family, houses, marriages);

    const recommendations = query.includeRecommendations
      ? this.generateRecommendations(houses, s40Compliance)
      : [];

    const response: KenyanLegalComplianceResponse = {
      familyId: family.id,
      familyName: family.name,
      overallScore,
      overallStatus,
      lastChecked: now,
      nextCheckDue: nextDue,
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
      // Fixed: Removed parameter since it wasn't used
      history: query.includeHistory ? this.getComplianceHistory() : [],
      recommendations,
      legalAdvisor: {
        name: 'Kenya Law Society',
        phone: '+254202222222',
        email: 'info@lawsocietykenya.org',
        website: 'https://www.lawsocietykenya.org',
      },
    };

    if (query.legalDocumentationFormat) {
      (response as any).legalDocumentation = {
        preparedFor: 'Legal Review',
        preparedBy: 'Family Service System',
        datePrepared: new Date(),
        referenceNumber: `COMP-${response.familyId}-${Date.now()}`,
        disclaimer: 'This report is for informational purposes only.',
      };
    }

    return response;
  }

  // --- Calculation Helpers ---

  private calculateS40Compliance(
    family: Family,
    houses: PolygamousHouse[],
    marriages: Marriage[],
  ): any {
    const polygamousMarriages = marriages.filter((m) => m.isPolygamous);
    const certifiedHouses = houses.filter((h) => h.courtRecognized);
    const housesWithConsent = houses.filter((h) => h.wivesConsentObtained);

    const totalSharesPercentage = houses.reduce((sum, h) => sum + (h.houseSharePercentage || 0), 0);
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
    family: Family,
    houses: PolygamousHouse[],
    polygamousMarriages: Marriage[],
  ): string {
    if (!family.isPolygamous) return 'NOT_APPLICABLE';
    if (houses.length === 0) return 'NON_COMPLIANT';

    const issues = this.generateS40ComplianceIssues(family, houses, polygamousMarriages);
    if (issues.some((i) => i.severity === 'CRITICAL')) return 'NON_COMPLIANT';

    const subsequentHouses = houses.filter((h) => h.houseOrder > 1);
    if (subsequentHouses.some((h) => !h.wivesConsentObtained)) return 'PARTIAL';

    return 'COMPLIANT';
  }

  private generateS40ComplianceIssues(
    family: Family,
    houses: PolygamousHouse[],
    polygamousMarriages: Marriage[],
  ): any[] {
    const issues: any[] = [];

    if (family.isPolygamous && houses.length === 0) {
      issues.push({
        code: 'S40_NO_HOUSES',
        severity: 'CRITICAL',
        title: 'Polygamous Family Without Houses',
        description: 'Family is marked as polygamous but has no houses defined.',
        lawReference: 'Law of Succession Act, Section 40(1)',
        recommendation: 'Define polygamous houses.',
        isResolved: false,
      });
    }

    houses.forEach((house) => {
      // Rule: Houses beyond 1st need certification/consent validation more strictly
      if (house.houseOrder > 1 && !house.courtRecognized) {
        issues.push({
          code: 'S40_NO_CERTIFICATE',
          severity: 'HIGH',
          title: `House "${house.houseName}" Lacks Court Certification`,
          description: `House order ${house.houseOrder} lacks S.40 certificate.`,
          lawReference: 'Law of Succession Act, Section 40(1)',
          affectedId: house.id,
          affectedName: house.houseName,
          recommendation: 'Obtain court certificate.',
          isResolved: false,
        });
      }

      if (house.houseOrder > 1 && !house.wivesConsentObtained) {
        issues.push({
          code: 'S40_NO_CONSENT',
          severity: 'HIGH',
          title: `House "${house.houseName}" Lacks Wives Consent`,
          description: `No documented consent from existing wives.`,
          lawReference: 'Law of Succession Act, Section 40(2)',
          affectedId: house.id,
          affectedName: house.houseName,
          recommendation: 'Document consent.',
          isResolved: false,
        });
      }
    });

    // Check Unassigned Polygamous Marriages
    polygamousMarriages.forEach((m) => {
      if (!m.polygamousHouseId) {
        issues.push({
          code: 'S40_MARRIAGE_NO_HOUSE',
          severity: 'MEDIUM',
          title: 'Polygamous Marriage Unassigned',
          description: 'Marriage flagged as polygamous but not assigned to a house.',
          lawReference: 'S.40',
          affectedId: m.id,
          recommendation: 'Assign to house.',
          isResolved: false,
        });
      }
    });

    return issues;
  }

  // --- Other Act Helpers (Simplified) ---

  private calculateS29Compliance(family: Family): any {
    return {
      potentialDependants: family.dependantCount,
      verifiedDependants: 0,
      claimsFiled: 0,
      courtProvisions: 0,
      totalDependencyValue: 0,
      status: family.dependantCount > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateS70Compliance(family: Family): any {
    return {
      minorChildren: family.minorCount,
      appointedGuardians: 0,
      guardiansWithBonds: 0,
      pendingAnnualReports: 0,
      status: family.minorCount > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateChildrenActCompliance(family: Family): any {
    return {
      adoptedChildren: 0,
      validAdoptionOrders: 0,
      childrenInNeed: family.minorCount,
      status: 'COMPLIANT',
      issues: [],
    };
  }

  private calculateMarriageActCompliance(marriages: Marriage[]): any {
    const registered = marriages.filter((m) => m.details.registrationNumber);
    const customary = marriages.filter((m) => m.isCustomary);
    const islamic = marriages.filter((m) => m.isIslamic);

    return {
      totalMarriages: marriages.length,
      registeredMarriages: registered.length,
      customaryMarriages: customary.length,
      islamicMarriages: islamic.length,
      marriagesWithBridePrice: 0,
      marriagesWithSettledProperty: 0,
      status: marriages.length > 0 ? 'REQUIRES_REVIEW' : 'COMPLIANT',
      issues: [],
    };
  }

  private calculateOverallScore(s40Compliance: any): number {
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

  private generateComplianceIssues(
    family: Family,
    houses: PolygamousHouse[],
    marriages: Marriage[],
  ): any[] {
    return this.generateS40ComplianceIssues(family, houses, marriages);
  }

  private generateRecommendations(houses: PolygamousHouse[], s40Compliance: any): string[] {
    const recs: string[] = [];
    if (s40Compliance.status === 'NON_COMPLIANT') recs.push('Address critical S.40 issues.');

    houses.forEach((h) => {
      if (h.houseOrder > 1 && !h.courtRecognized) recs.push(`Obtain S.40 cert for ${h.houseName}`);
    });

    return recs;
  }

  // Placeholder: Connect to Audit Log / History Repo in production
  private getComplianceHistory(): any[] {
    return [];
  }
}
