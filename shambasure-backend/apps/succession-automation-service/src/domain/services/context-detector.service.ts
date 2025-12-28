// src/succession-automation/src/domain/services/context-detector.service.ts
import {
  SuccessionContext,
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '../value-objects/succession-context.vo';

/**
 * Context Detector Service
 *
 * PURPOSE: The "Analyst" - determines the SuccessionContext by analyzing
 * Family and Estate data. This is the FIRST step in the automation pipeline.
 *
 * INPUT:
 * - Family data (from family-service): marriages, religion, polygamy, minors
 * - Estate data (from estate-service): will existence, asset value
 *
 * OUTPUT:
 * - SuccessionContext (regime, marriage type, religion, complexity)
 *
 * LEGAL LOGIC:
 * - Testate vs Intestate: Does a valid, active Will exist?
 * - Monogamous vs Polygamous: S.40 LSA - multiple wives?
 * - Islamic vs Statutory: Religion determines court jurisdiction
 * - Complexity Score: Based on disputes, minors, asset value
 *
 * USAGE:
 * ```typescript
 * const context = await contextDetector.detect(estateId);
 * // Returns: { regime: 'INTESTATE', marriageType: 'POLYGAMOUS', religion: 'STATUTORY' }
 * ```
 */

// ============================================================================
// READ MODEL INTERFACES (From Other Services)
// These represent the data we receive from Family/Estate services via events
// ============================================================================

export interface FamilyReadModel {
  familyId: string;
  deceasedMemberId: string;
  deceasedFullName: string;
  deceasedDateOfDeath?: Date;
  deceasedReligion?: string;

  // Marriage Context
  marriages: MarriageReadModel[];
  isPolygamous: boolean;
  polygamousHouseCount: number;

  // Children & Dependants
  children: FamilyMemberReadModel[];
  hasMinors: boolean;
  minorCount: number;

  // Disputes
  hasDisputedRelationships: boolean;
  cohabitationClaims: CohabitationClaimReadModel[];
}

export interface MarriageReadModel {
  marriageId: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageType: string; // CIVIL, CHRISTIAN, CUSTOMARY, ISLAMIC
  isPolygamous: boolean;
  polygamousHouseId?: string;
  isActive: boolean;
}

export interface FamilyMemberReadModel {
  memberId: string;
  fullName: string;
  dateOfBirth?: Date;
  isAlive: boolean;
  isMinor: boolean;
  hasGuardian: boolean;
}

export interface CohabitationClaimReadModel {
  claimId: string;
  partner1Id: string;
  partner2Id: string;
  durationYears: number;
  hasChildren: boolean;
  qualifiesForS29: boolean;
}

export interface EstateReadModel {
  estateId: string;
  deceasedId: string;

  // Will Status
  hasWill: boolean;
  willStatus?: string; // ACTIVE, CONTESTED, REVOKED
  willType?: string;

  // Financial
  grossValueKES: number;
  netEstateValueKES: number;
  totalDebtsKES: number;
  isInsolvent: boolean;

  // Assets
  assetCount: number;
  hasDisputedAssets: boolean;
  hasEncumberedAssets: boolean;
}

// ============================================================================
// CONTEXT DETECTION RESULT
// ============================================================================

export interface ContextDetectionResult {
  context: SuccessionContext;
  confidence: number; // 0-100 (how confident are we?)
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// CONTEXT DETECTOR SERVICE
// ============================================================================

export class ContextDetectorService {
  /**
   * Detect succession context from Family and Estate data
   */
  public async detect(
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
  ): Promise<ContextDetectionResult> {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let confidence = 100; // Start at 100%, deduct for ambiguities

    // Step 1: Detect Regime (Testate vs Intestate)
    const regime = this.detectRegime(estateData, warnings);

    // Step 2: Detect Marriage Type (Monogamous vs Polygamous)
    const marriageType = this.detectMarriageType(familyData, warnings);

    // Step 3: Detect Religion (determines court)
    const religion = this.detectReligion(familyData, estateData, warnings);

    // Step 4: Check for minors (guardianship required)
    const isMinorInvolved = familyData.hasMinors;

    // Step 5: Check for disputes
    const hasDisputedAssets = this.detectDisputes(familyData, estateData, warnings);

    // Step 6: Calculate complexity score
    const complexityScore = this.calculateComplexity(
      regime,
      marriageType,
      religion,
      familyData,
      estateData,
    );

    // Step 7: Generate recommendations
    this.generateRecommendations(
      regime,
      marriageType,
      religion,
      familyData,
      estateData,
      recommendations,
    );

    // Step 8: Adjust confidence based on ambiguities
    confidence -= warnings.length * 10; // -10% per warning
    confidence = Math.max(0, confidence);

    // Step 9: Create SuccessionContext
    const context = SuccessionContext.create({
      regime,
      marriageType,
      religion,
      isMinorInvolved,
      hasDisputedAssets,
      estimatedComplexityScore: complexityScore,
    });

    return {
      context,
      confidence,
      warnings,
      recommendations,
    };
  }

  // ==================== PRIVATE DETECTION METHODS ====================

  /**
   * Detect Regime (Testate vs Intestate)
   * LEGAL BASIS: S.5 LSA - Will determines testate succession
   */
  private detectRegime(estateData: EstateReadModel, warnings: string[]): SuccessionRegime {
    // No Will = Intestate
    if (!estateData.hasWill) {
      return SuccessionRegime.INTESTATE;
    }

    // Will exists but contested = Ambiguous
    if (estateData.willStatus === 'CONTESTED') {
      warnings.push('Will is contested - may revert to intestate if invalidated');
      return SuccessionRegime.TESTATE; // Assume valid unless proven otherwise
    }

    // Will exists but revoked = Intestate
    if (estateData.willStatus === 'REVOKED') {
      warnings.push('Will was revoked - treating as intestate');
      return SuccessionRegime.INTESTATE;
    }

    // Will exists and active = Testate
    if (estateData.willStatus === 'ACTIVE') {
      return SuccessionRegime.TESTATE;
    }

    // Default: If hasWill but status unclear
    warnings.push('Will status unclear - assuming testate');
    return SuccessionRegime.TESTATE;
  }

  /**
   * Detect Marriage Type
   * LEGAL BASIS: S.40 LSA - Polygamous marriages require special distribution
   */
  private detectMarriageType(
    familyData: FamilyReadModel,
    warnings: string[],
  ): SuccessionMarriageType {
    // No marriages = Single
    if (familyData.marriages.length === 0) {
      return SuccessionMarriageType.SINGLE;
    }

    // Explicit polygamy flag
    if (familyData.isPolygamous) {
      if (familyData.polygamousHouseCount === 0) {
        warnings.push('Polygamous marriage detected but houses not defined (S.40 LSA violation)');
      }
      return SuccessionMarriageType.POLYGAMOUS;
    }

    // Multiple active marriages = Polygamous
    const activeMarriages = familyData.marriages.filter((m) => m.isActive);
    if (activeMarriages.length > 1) {
      warnings.push(
        `${activeMarriages.length} active marriages detected - assuming polygamous (S.40 applies)`,
      );
      return SuccessionMarriageType.POLYGAMOUS;
    }

    // Check for cohabitation claims (S.29 LSA)
    if (familyData.cohabitationClaims.length > 0) {
      const qualifyingClaims = familyData.cohabitationClaims.filter((c) => c.qualifiesForS29);
      if (qualifyingClaims.length > 0) {
        warnings.push(
          `${qualifyingClaims.length} cohabitation claim(s) qualifying under S.29 LSA - ` +
            `expect disputes if not resolved`,
        );
        return SuccessionMarriageType.COHABITATION;
      }
    }

    // Single marriage = Monogamous
    return SuccessionMarriageType.MONOGAMOUS;
  }

  /**
   * Detect Religion (determines court jurisdiction)
   * LEGAL BASIS: Article 170 Constitution - Kadhi's Courts for Islamic law
   */
  private detectReligion(
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
    warnings: string[],
  ): SuccessionReligion {
    const religion = familyData.deceasedReligion?.toUpperCase();

    // Islamic = Kadhi's Court
    if (religion === 'ISLAMIC' || religion === 'MUSLIM') {
      // Check if Will exists (Islamic wills have 1/3 limit)
      if (estateData.hasWill) {
        warnings.push('Islamic Will detected - subject to Sharia restrictions (max 1/3 of estate)');
      }
      return SuccessionReligion.ISLAMIC;
    }

    // Hindu = Hindu Succession Act
    if (religion === 'HINDU') {
      return SuccessionReligion.HINDU;
    }

    // Christian (default to Statutory)
    if (religion === 'CHRISTIAN' || religion === 'CATHOLIC' || religion === 'PROTESTANT') {
      return SuccessionReligion.CHRISTIAN;
    }

    // African Customary
    if (religion === 'AFRICAN_CUSTOMARY' || religion === 'TRADITIONAL') {
      warnings.push("Customary succession - may require elders' involvement");
      return SuccessionReligion.AFRICAN_CUSTOMARY;
    }

    // Default: Statutory (Law of Succession Act)
    if (!religion) {
      warnings.push('Religion not specified - defaulting to Statutory (LSA)');
    }

    return SuccessionReligion.STATUTORY;
  }

  /**
   * Detect disputes and contentious issues
   */
  private detectDisputes(
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
    warnings: string[],
  ): boolean {
    let hasDisputes = false;

    // Family disputes
    if (familyData.hasDisputedRelationships) {
      warnings.push('Disputed family relationships detected - may delay proceedings');
      hasDisputes = true;
    }

    // Asset disputes
    if (estateData.hasDisputedAssets) {
      warnings.push('Disputed assets detected - may require valuation or court intervention');
      hasDisputes = true;
    }

    // Cohabitation claims
    if (familyData.cohabitationClaims.length > 0) {
      warnings.push(
        `${familyData.cohabitationClaims.length} cohabitation claim(s) - ` +
          `high dispute probability`,
      );
      hasDisputes = true;
    }

    // Encumbered assets (mortgages, charges)
    if (estateData.hasEncumberedAssets) {
      warnings.push('Assets with encumbrances detected - creditors may contest');
      hasDisputes = true;
    }

    // Insolvency (debts > assets)
    if (estateData.isInsolvent) {
      warnings.push(
        'CRITICAL: Estate is insolvent (debts exceed assets) - ' +
          'creditors will take priority (S.45 LSA)',
      );
      hasDisputes = true;
    }

    return hasDisputes;
  }

  /**
   * Calculate complexity score (1-10)
   * Used to prioritize support resources and estimate timeline
   */
  private calculateComplexity(
    regime: SuccessionRegime,
    marriageType: SuccessionMarriageType,
    religion: SuccessionReligion,
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
  ): number {
    let score = 1; // Base score

    // Regime complexity
    if (regime === SuccessionRegime.INTESTATE) {
      score += 1; // Chief's letter, more forms
    }
    if (regime === SuccessionRegime.PARTIALLY_INTESTATE) {
      score += 2; // Mixed distribution
    }
    if (regime === SuccessionRegime.CUSTOMARY) {
      score += 3; // Requires elders' involvement
    }

    // Marriage complexity
    if (marriageType === SuccessionMarriageType.POLYGAMOUS) {
      score += familyData.polygamousHouseCount; // +1 per house
    }
    if (marriageType === SuccessionMarriageType.COHABITATION) {
      score += 2; // High dispute probability
    }

    // Religious complexity
    if (religion === SuccessionReligion.ISLAMIC) {
      score += 1; // Different court, different rules
    }
    if (religion === SuccessionReligion.AFRICAN_CUSTOMARY) {
      score += 2; // Requires customary proceedings
    }

    // Minor complexity
    if (familyData.hasMinors) {
      score += familyData.minorCount; // +1 per minor (guardianship)
    }

    // Dispute complexity
    if (familyData.hasDisputedRelationships) {
      score += 1;
    }
    if (estateData.hasDisputedAssets) {
      score += 1;
    }
    if (familyData.cohabitationClaims.length > 0) {
      score += familyData.cohabitationClaims.length;
    }

    // Asset complexity
    if (estateData.assetCount > 10) {
      score += 1; // Large estate
    }
    if (estateData.grossValueKES > 10_000_000) {
      score += 1; // High value (> KES 10M)
    }
    if (estateData.isInsolvent) {
      score += 2; // Insolvency proceedings
    }

    // Cap at 10
    return Math.min(10, score);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    regime: SuccessionRegime,
    marriageType: SuccessionMarriageType,
    religion: SuccessionReligion,
    familyData: FamilyReadModel,
    estateData: EstateReadModel,
    recommendations: string[],
  ): void {
    // Intestate cases
    if (regime === SuccessionRegime.INTESTATE) {
      recommendations.push('Obtain Letter from Area Chief confirming next of kin');
      recommendations.push('File P&A 80 (Letters of Administration)');
    }

    // Testate cases
    if (regime === SuccessionRegime.TESTATE) {
      recommendations.push('Locate original Will document');
      recommendations.push('Verify Will signatures (2 witnesses required)');
      recommendations.push('File P&A 1 (Grant of Probate)');
    }

    // Polygamous cases
    if (marriageType === SuccessionMarriageType.POLYGAMOUS) {
      if (familyData.polygamousHouseCount === 0) {
        recommendations.push('CRITICAL: Define polygamous houses (S.40 LSA requirement)');
      }
      recommendations.push('Allocate assets per house as per S.40 distribution formula');
      recommendations.push('Obtain consent from all wives and house heads');
    }

    // Islamic cases
    if (religion === SuccessionReligion.ISLAMIC) {
      recommendations.push("File in Kadhi's Court (Article 170 Constitution)");
      recommendations.push('Apply Sharia inheritance rules (fixed shares)');
      if (estateData.hasWill) {
        recommendations.push('Verify Will does not exceed 1/3 of estate (Wasiyya limit)');
      }
    }

    // Minors
    if (familyData.hasMinors) {
      const minorsWithoutGuardians = familyData.children.filter((c) => c.isMinor && !c.hasGuardian);
      if (minorsWithoutGuardians.length > 0) {
        recommendations.push(
          `CRITICAL: Appoint guardian(s) for ${minorsWithoutGuardians.length} minor(s) (S.71 Children Act)`,
        );
      }
    }

    // Cohabitation claims
    if (familyData.cohabitationClaims.length > 0) {
      recommendations.push(
        'Address cohabitation claims under S.29 LSA (may require court determination)',
      );
      recommendations.push('Gather evidence: joint residence, financial support, children');
    }

    // Insolvency
    if (estateData.isInsolvent) {
      recommendations.push('CRITICAL: Estate is insolvent - prioritize debt payment per S.45 LSA');
      recommendations.push('Consider asset liquidation to settle secured debts');
      recommendations.push('Notify all creditors (funeral expenses have priority)');
    }

    // High value estates
    if (estateData.grossValueKES > 5_000_000) {
      recommendations.push('File in High Court (jurisdiction for estates > KES 5M)');
      recommendations.push('Obtain professional valuation report for assets');
    }

    // Disputed assets
    if (estateData.hasDisputedAssets) {
      recommendations.push('Resolve asset disputes before filing (may require mediation)');
      recommendations.push('Consider ADR (Alternative Dispute Resolution) to avoid delays');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Quick check: Is this case simple or complex?
   */
  public isSimpleCase(result: ContextDetectionResult): boolean {
    return result.context.isSimpleCase() && result.warnings.length === 0 && result.confidence >= 90;
  }

  /**
   * Quick check: Should this case go to Kadhi's Court?
   */
  public requiresKadhisCourt(result: ContextDetectionResult): boolean {
    return result.context.requiresKadhisCourt();
  }

  /**
   * Quick check: Should this case go to High Court?
   */
  public requiresHighCourt(result: ContextDetectionResult, estateValueKES: number): boolean {
    return result.context.requiresHighCourt(estateValueKES);
  }

  /**
   * Get recommended court
   */
  public getRecommendedCourt(
    result: ContextDetectionResult,
    estateValueKES: number,
    county: string,
  ): string {
    if (this.requiresKadhisCourt(result)) {
      return `Kadhi's Court ${county}`;
    }

    if (this.requiresHighCourt(result, estateValueKES)) {
      return `High Court ${county}`;
    }

    return `Magistrate's Court ${county}`;
  }
}
