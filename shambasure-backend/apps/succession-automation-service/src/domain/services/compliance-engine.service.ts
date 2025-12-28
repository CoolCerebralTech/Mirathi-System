// src/succession-automation/src/domain/services/compliance-engine.service.ts
import { RiskCategory, RiskFlag, RiskSeverity } from '../entities/risk-flag.entity';
import { DocumentGap } from '../value-objects/document-gap.vo';
import { RiskSource } from '../value-objects/risk-source.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';
import { EstateReadModel, FamilyReadModel } from './context-detector.service';

/**
 * Compliance Engine Service
 *
 * PURPOSE: The "Inspector" - runs the "Fatal 10" compliance rules
 * to detect legal risks that would block court filing.
 *
 * INPUT:
 * - SuccessionContext (from ContextDetectorService)
 * - Family data (from family-service)
 * - Estate data (from estate-service)
 *
 * OUTPUT:
 * - Array of RiskFlag entities to add to ReadinessAssessment
 *
 * THE "FATAL 10" RULES (Based on Kenyan Law):
 * R001: Missing Death Certificate (CRITICAL)
 * R002: Missing Chief's Letter (CRITICAL for Intestate)
 * R003: Minor child without guardian (CRITICAL - S.71)
 * R004: Non-resident applicant (HIGH)
 * R005: Wrong court jurisdiction (CRITICAL)
 * R006: Will not witnessed properly (CRITICAL - S.11)
 * R007: Minor executor (CRITICAL - S.6)
 * R008: Missing KRA PIN (CRITICAL)
 * R009: Undefined polygamous structure (CRITICAL - S.40)
 * R010: Insolvent estate (CRITICAL - S.45)
 *
 * USAGE:
 * ```typescript
 * const risks = await complianceEngine.runCompliance(context, family, estate);
 * // Returns: [RiskFlag, RiskFlag, ...]
 * ```
 */

// ============================================================================
// WILL READ MODEL (Simplified)
// ============================================================================

export interface WillReadModel {
  willId: string;
  status: string; // ACTIVE, REVOKED, CONTESTED
  witnessCount: number;
  witnesses: WitnessReadModel[];
  executors: ExecutorReadModel[];
}

export interface WitnessReadModel {
  witnessId: string;
  fullName: string;
  age?: number;
  nationalId?: string;
  isBeneficiary: boolean; // S.11 LSA - beneficiary cannot be witness
}

export interface ExecutorReadModel {
  executorId: string;
  fullName: string;
  dateOfBirth?: Date;
  isMinor: boolean;
  isPrimary: boolean;
}

// ============================================================================
// COMPLIANCE RESULT
// ============================================================================

export interface ComplianceResult {
  risks: RiskFlag[];
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  canFile: boolean; // false if any critical risks exist
  summary: string;
}

// ============================================================================
// COMPLIANCE ENGINE SERVICE
// ============================================================================

export class ComplianceEngineService {
  /**
   * Run all compliance checks
   * Returns array of RiskFlag entities
   */
  public async runCompliance(
    context: SuccessionContext,
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
    willData?: WillReadModel,
  ): Promise<ComplianceResult> {
    const risks: RiskFlag[] = [];

    // Run all "Fatal 10" rules
    this.checkR001_MissingDeathCert(estateData, familyData, risks);
    this.checkR002_MissingChiefLetter(context, estateData, familyData, risks);
    this.checkR003_MinorWithoutGuardian(familyData, risks);
    this.checkR004_NonResidentApplicant(estateData, risks);
    this.checkR005_WrongCourtJurisdiction(context, estateData, risks);
    this.checkR006_InvalidWillSignature(context, willData, risks);
    this.checkR007_MinorExecutor(context, willData, risks);
    this.checkR008_MissingKraPin(estateData, risks);
    this.checkR009_UndefinedPolygamousStructure(context, familyData, risks);
    this.checkR010_InsolventEstate(estateData, risks);

    // Additional checks (beyond "Fatal 10")
    this.checkAdditionalRisks(context, familyData, estateData, willData, risks);

    // Calculate summary
    const criticalRiskCount = risks.filter((r) => r.severity === RiskSeverity.CRITICAL).length;
    const highRiskCount = risks.filter((r) => r.severity === RiskSeverity.HIGH).length;
    const mediumRiskCount = risks.filter((r) => r.severity === RiskSeverity.MEDIUM).length;
    const lowRiskCount = risks.filter((r) => r.severity === RiskSeverity.LOW).length;

    const canFile = criticalRiskCount === 0;

    const summary = this.generateSummary(
      criticalRiskCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    );

    return {
      risks,
      criticalRiskCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      canFile,
      summary,
    };
  }

  // ==================== "FATAL 10" COMPLIANCE RULES ====================

  /**
   * R001: Missing Death Certificate (CRITICAL)
   * LEGAL BASIS: S.56 LSA - Death Certificate mandatory for all succession cases
   */
  private checkR001_MissingDeathCert(
    estateData: EstateReadModel,
    familyData: FamilyReadModel,
    risks: RiskFlag[],
  ): void {
    // Check if death certificate exists (we'd need to check document service)
    // For now, we assume a field like hasDeathCertificate
    // In real implementation, this would query the document service

    const hasDeathCert = false; // TODO: Query document service

    if (!hasDeathCert) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'S.56 LSA',
      );

      const risk = RiskFlag.createMissingDeathCert(estateData.estateId, source);
      risks.push(risk);
    }
  }

  /**
   * R002: Missing Chief's Letter (CRITICAL for Intestate)
   * LEGAL BASIS: Customary requirement for intestate cases
   */
  private checkR002_MissingChiefLetter(
    context: SuccessionContext,
    estateData: EstateReadModel,
    familyData: FamilyReadModel,
    risks: RiskFlag[],
  ): void {
    // Only required for Intestate cases
    if (context.regime !== 'INTESTATE') {
      return;
    }

    const hasChiefLetter = false; // TODO: Query document service

    if (!hasChiefLetter) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'Customary requirement',
      );

      const risk = RiskFlag.createMissingChiefLetter(estateData.estateId, source);
      risks.push(risk);
    }
  }

  /**
   * R003: Minor child without guardian (CRITICAL)
   * LEGAL BASIS: S.71 Children Act - Minors must have legal guardian
   */
  private checkR003_MinorWithoutGuardian(familyData: FamilyReadModel, risks: RiskFlag[]): void {
    if (!familyData.hasMinors) {
      return;
    }

    // Find minors without guardians
    const minorsWithoutGuardians = familyData.children.filter(
      (child) => child.isMinor && !child.hasGuardian,
    );

    for (const minor of minorsWithoutGuardians) {
      const source = RiskSource.fromFamilyService(
        minor.memberId,
        'FamilyMember',
        'RULE_ENGINE',
        'S.71 Children Act',
      );

      const risk = RiskFlag.createMinorWithoutGuardian(minor.memberId, minor.fullName, source);

      risks.push(risk);
    }
  }

  /**
   * R004: Non-resident applicant (HIGH)
   * LEGAL BASIS: S.56 LSA - Applicant must be Kenya resident
   */
  private checkR004_NonResidentApplicant(estateData: EstateReadModel, risks: RiskFlag[]): void {
    // TODO: Check applicant residence status
    // This would require applicant data from the application
    // For now, we skip this check
  }

  /**
   * R005: Wrong court jurisdiction (CRITICAL)
   * LEGAL BASIS: S.56 LSA - Jurisdiction based on estate value
   */
  private checkR005_WrongCourtJurisdiction(
    context: SuccessionContext,
    estateData: EstateReadModel,
    risks: RiskFlag[],
  ): void {
    // Determine correct court
    let suggestedCourt: string;

    if (context.requiresKadhisCourt()) {
      suggestedCourt = "Kadhi's Court";
    } else if (context.requiresHighCourt(estateData.grossValueKES)) {
      suggestedCourt = 'High Court';
    } else {
      suggestedCourt = "Magistrate's Court";
    }

    // TODO: Check if application is targeting wrong court
    // This would require application data
    // For now, we just detect and recommend

    const source = RiskSource.fromEstateService(
      estateData.estateId,
      'Estate',
      'RULE_ENGINE',
      'S.56 LSA',
    );

    // We create the risk only if we detect wrong court
    // In real implementation, this would compare with application.targetCourt
  }

  /**
   * R006: Will not witnessed properly (CRITICAL)
   * LEGAL BASIS: S.11 LSA - Will must be signed by 2 witnesses
   */
  private checkR006_InvalidWillSignature(
    context: SuccessionContext,
    willData: WillReadModel | undefined,
    risks: RiskFlag[],
  ): void {
    // Only check for Testate cases
    if (context.regime !== 'TESTATE' || !willData) {
      return;
    }

    // Check witness count
    if (willData.witnessCount < 2) {
      const source = RiskSource.fromWillService(willData.willId, 'RULE_ENGINE', 'S.11 LSA');

      const risk = RiskFlag.createInvalidWillSignature(
        willData.willId,
        willData.witnessCount,
        source,
      );

      risks.push(risk);
      return;
    }

    // Check if witnesses are beneficiaries (S.11 violation)
    const beneficiaryWitnesses = willData.witnesses.filter((w) => w.isBeneficiary);

    if (beneficiaryWitnesses.length > 0) {
      const source = RiskSource.fromWillService(
        willData.willId,
        'RULE_ENGINE',
        'S.11 LSA - Beneficiary cannot witness',
      );

      const risk = RiskFlag.create({
        severity: RiskSeverity.CRITICAL,
        category: RiskCategory.BENEFICIARY_AS_WITNESS,
        description: `${beneficiaryWitnesses.length} witness(es) are also beneficiaries (S.11 LSA violation)`,
        source,
        legalBasis: 'S.11 LSA - Witness cannot be a beneficiary',
        mitigationSteps: [
          'Remove beneficiaries as witnesses',
          'Add new witnesses who are not beneficiaries',
          'Witnesses must be 18+ and mentally competent',
        ],
        affectedEntityIds: beneficiaryWitnesses.map((w) => w.witnessId),
        autoResolvable: true,
      });

      risks.push(risk);
    }
  }

  /**
   * R007: Minor executor (CRITICAL)
   * LEGAL BASIS: S.6 LSA - Executor must be of full age (18+)
   */
  private checkR007_MinorExecutor(
    context: SuccessionContext,
    willData: WillReadModel | undefined,
    risks: RiskFlag[],
  ): void {
    // Only check for Testate cases
    if (context.regime !== 'TESTATE' || !willData) {
      return;
    }

    // Find minor executors
    const minorExecutors = willData.executors.filter((e) => e.isMinor);

    for (const executor of minorExecutors) {
      const source = RiskSource.fromWillService(willData.willId, 'RULE_ENGINE', 'S.6 LSA');

      const risk = RiskFlag.createMinorExecutor(
        willData.willId,
        executor.executorId,
        executor.fullName,
        source,
      );

      risks.push(risk);
    }
  }

  /**
   * R008: Missing KRA PIN (CRITICAL)
   * LEGAL BASIS: Tax Procedures Act - Required for estate valuation
   */
  private checkR008_MissingKraPin(estateData: EstateReadModel, risks: RiskFlag[]): void {
    const hasKraPin = false; // TODO: Query tax compliance data

    if (!hasKraPin) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'Tax Procedures Act',
      );

      const risk = RiskFlag.createMissingKraPin(estateData.estateId, source);
      risks.push(risk);
    }
  }

  /**
   * R009: Undefined polygamous structure (CRITICAL)
   * LEGAL BASIS: S.40 LSA - Property distributed by house
   */
  private checkR009_UndefinedPolygamousStructure(
    context: SuccessionContext,
    familyData: FamilyReadModel,
    risks: RiskFlag[],
  ): void {
    // Only check if polygamous
    if (!context.isSection40Applicable()) {
      return;
    }

    // Check if houses are defined
    if (familyData.polygamousHouseCount === 0) {
      const source = RiskSource.fromFamilyService(
        familyData.familyId,
        'Family',
        'RULE_ENGINE',
        'S.40 LSA',
      );

      const risk = RiskFlag.createUndefinedPolygamousStructure(familyData.familyId, source);

      risks.push(risk);
    }
  }

  /**
   * R010: Insolvent estate (CRITICAL)
   * LEGAL BASIS: S.45 LSA - Debts must be paid before distribution
   */
  private checkR010_InsolventEstate(estateData: EstateReadModel, risks: RiskFlag[]): void {
    if (estateData.isInsolvent) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'S.45 LSA',
      );

      const risk = RiskFlag.createInsolventEstate(
        estateData.estateId,
        estateData.grossValueKES,
        estateData.totalDebtsKES,
        source,
      );

      risks.push(risk);
    }
  }

  // ==================== ADDITIONAL RISK CHECKS ====================

  /**
   * Additional checks beyond "Fatal 10"
   */
  private checkAdditionalRisks(
    context: SuccessionContext,
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
    willData: WillReadModel | undefined,
    risks: RiskFlag[],
  ): void {
    // Cohabitation claims (HIGH risk)
    if (familyData.cohabitationClaims.length > 0) {
      const qualifyingClaims = familyData.cohabitationClaims.filter((c) => c.qualifiesForS29);

      if (qualifyingClaims.length > 0) {
        const source = RiskSource.fromFamilyService(
          familyData.familyId,
          'Family',
          'RULE_ENGINE',
          'S.29 LSA',
        );

        const risk = RiskFlag.create({
          severity: RiskSeverity.HIGH,
          category: RiskCategory.COHABITATION_CLAIM,
          description: `${qualifyingClaims.length} cohabitation claim(s) qualifying under S.29 LSA`,
          source,
          legalBasis: 'S.29 LSA - Dependants may claim provision',
          mitigationSteps: [
            'Verify cohabitation duration (>= 2 years)',
            'Check for children born during cohabitation',
            'Prepare evidence: joint residence, financial support',
            'Consider mediation before court filing',
          ],
          affectedEntityIds: qualifyingClaims.map((c) => c.claimId),
          autoResolvable: false,
        });

        risks.push(risk);
      }
    }

    // Disputed assets (HIGH risk)
    if (estateData.hasDisputedAssets) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'S.45 LSA',
      );

      const risk = RiskFlag.create({
        severity: RiskSeverity.HIGH,
        category: RiskCategory.ASSET_VERIFICATION_FAILED,
        description: 'Disputed assets detected - may require court determination',
        source,
        legalBasis: 'S.45 LSA - Assets must be verified before distribution',
        mitigationSteps: [
          'Identify disputed assets',
          'Gather ownership documents',
          'Consider ADR (Alternative Dispute Resolution)',
          'May need to exclude disputed assets from initial distribution',
        ],
        affectedEntityIds: [estateData.estateId],
        autoResolvable: false,
      });

      risks.push(risk);
    }

    // Encumbered assets (MEDIUM risk)
    if (estateData.hasEncumberedAssets) {
      const source = RiskSource.fromEstateService(
        estateData.estateId,
        'Estate',
        'RULE_ENGINE',
        'S.45 LSA',
      );

      const risk = RiskFlag.create({
        severity: RiskSeverity.MEDIUM,
        category: RiskCategory.ENCUMBERED_ASSET,
        description: 'Assets with encumbrances (mortgages, charges) detected',
        source,
        legalBasis: 'S.45 LSA - Secured debts have priority',
        mitigationSteps: [
          'List all encumbrances (mortgages, charges)',
          'Verify outstanding balances',
          'Creditors must be notified',
          'Consider asset liquidation if debt exceeds value',
        ],
        affectedEntityIds: [estateData.estateId],
        autoResolvable: false,
      });

      risks.push(risk);
    }

    // Contested Will (HIGH risk)
    if (context.regime === 'TESTATE' && willData?.status === 'CONTESTED') {
      const source = RiskSource.fromWillService(willData.willId, 'RULE_ENGINE', 'S.5 LSA');

      const risk = RiskFlag.create({
        severity: RiskSeverity.HIGH,
        category: RiskCategory.CONTESTED_WILL,
        description: 'Will is being contested - may revert to intestate succession',
        source,
        legalBasis: 'S.5 LSA - Will validity must be established',
        mitigationSteps: [
          'Address contestation grounds',
          'Gather evidence of testamentary capacity',
          'Verify no undue influence',
          'Consider mediation with contestants',
          'May need to await court determination',
        ],
        affectedEntityIds: [willData.willId],
        autoResolvable: false,
      });

      risks.push(risk);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate summary message
   */
  private generateSummary(critical: number, high: number, medium: number, low: number): string {
    if (critical > 0) {
      return `BLOCKED: ${critical} critical issue(s) must be resolved before filing.`;
    }

    if (high > 0) {
      return `CAUTION: ${high} high-priority issue(s) detected. Filing may be rejected.`;
    }

    if (medium > 0) {
      return `READY WITH WARNINGS: ${medium} issue(s) may cause court queries.`;
    }

    if (low > 0) {
      return `READY: ${low} minor issue(s) detected. Consider resolving for smoother processing.`;
    }

    return 'PERFECT: No issues detected. Ready to file.';
  }

  /**
   * Filter risks by severity
   */
  public filterRisksBySeverity(risks: RiskFlag[], severity: RiskSeverity): RiskFlag[] {
    return risks.filter((r) => r.severity === severity);
  }

  /**
   * Get top priority risks (for UI)
   */
  public getTopPriorityRisks(risks: RiskFlag[], limit: number = 5): RiskFlag[] {
    return risks.sort((a, b) => b.getPriorityScore() - a.getPriorityScore()).slice(0, limit);
  }
}
