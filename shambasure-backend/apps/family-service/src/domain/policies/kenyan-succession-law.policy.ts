// domain/policies/kenyan-succession-law.policy.ts
import { FamilyMember } from '../entities/family-member.entity';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { FamilyTreeBuilder } from '../utils/family-tree-builder';
import {
  Section35Distribution,
  Section35IntestatePolicy,
} from './law-of-succession-act/section-35-intestate.policy';
import {
  Section40Distribution,
  Section40PolygamyPolicy,
} from './law-of-succession-act/section-40-polygamy.policy';

export interface SuccessionAnalysis {
  applicableSection: string;
  distribution: Section35Distribution | Section40Distribution | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  requiresCourtConfirmation: boolean;
  estimatedCourtFees: number;
  estimatedProcessingTime: string;
}

export class KenyanSuccessionLaw {
  static analyzeSuccession(
    deceasedId: string,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
    estateValue: number,
    hasValidWill: boolean = false,
  ): SuccessionAnalysis {
    const analysis: SuccessionAnalysis = {
      applicableSection: '',
      distribution: null,
      isValid: false,
      errors: [],
      warnings: [],
      recommendations: [],
      requiresCourtConfirmation: true,
      estimatedCourtFees: 0,
      estimatedProcessingTime: '3-6 months',
    };

    const deceased = members.find((m) => m.id === deceasedId);

    if (!deceased) {
      analysis.errors.push(`Deceased member ${deceasedId} not found`);
      return analysis;
    }

    if (!deceased.isDeceased) {
      analysis.errors.push(`Member ${deceasedId} is not marked as deceased`);
      return analysis;
    }

    if (hasValidWill) {
      analysis.applicableSection = 'TESTATE';
      analysis.recommendations.push(
        'Valid will exists. Proceed with probate under Part III of LSA.',
      );
      analysis.estimatedCourtFees = this.calculateCourtFees(estateValue);
      return analysis;
    }

    // Determine applicable intestate section
    const isPolygamous = this.isPolygamousFamily(deceasedId, members, relationships);

    if (isPolygamous) {
      analysis.applicableSection = 'S.40';
      analysis.distribution = this.analyzeSection40(
        deceasedId,
        members,
        relationships,
        estateValue,
      );
      analysis.requiresCourtConfirmation = true;
      analysis.estimatedCourtFees = this.calculateCourtFees(estateValue) * 1.5; // Higher for polygamy
      analysis.estimatedProcessingTime = '6-12 months';
    } else {
      analysis.applicableSection = 'S.35';
      analysis.distribution = this.analyzeSection35(
        deceasedId,
        members,
        relationships,
        estateValue,
      );
      analysis.requiresCourtConfirmation = true;
      analysis.estimatedCourtFees = this.calculateCourtFees(estateValue);
    }

    // Validate distribution
    if (analysis.distribution) {
      const validation =
        analysis.applicableSection === 'S.35'
          ? Section35IntestatePolicy.validateDistribution(
              analysis.distribution as Section35Distribution,
              estateValue,
            )
          : { isValid: true, errors: [], warnings: [] }; // Simplified for S.40

      analysis.isValid = validation.isValid;
      analysis.errors.push(...validation.errors);
      analysis.warnings.push(...validation.warnings);
    }

    // Generate recommendations
    this.generateRecommendations(analysis, members, relationships);

    return analysis;
  }

  private static isPolygamousFamily(
    deceasedId: string,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
  ): boolean {
    const deceased = members.find((m) => m.id === deceasedId);
    if (!deceased) return false;

    // Check if deceased was in a polygamous marriage
    if (deceased.polygamousHouseId) {
      return true;
    }

    // Check for multiple surviving spouses
    const nodes = FamilyTreeBuilder.buildTree(members, relationships);
    const deceasedNode = nodes.get(deceasedId);

    if (!deceasedNode) return false;

    const survivingSpouses = deceasedNode.spouses.filter((spouseNode) => {
      const spouse = members.find((m) => m.id === spouseNode.memberId);
      return spouse && !spouse.isDeceased;
    });

    return survivingSpouses.length > 1;
  }

  private static analyzeSection35(
    deceasedId: string,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
    estateValue: number,
  ): Section35Distribution {
    return Section35IntestatePolicy.calculateDistribution(
      deceasedId,
      members,
      relationships,
      estateValue,
    );
  }

  private static analyzeSection40(
    deceasedId: string,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
    estateValue: number,
  ): Section40Distribution {
    const houseAssignments = Section40PolygamyPolicy.generateHouseAssignments(
      deceasedId,
      members,
      relationships,
    );

    return Section40PolygamyPolicy.calculateDistribution(
      deceasedId,
      members,
      relationships,
      estateValue,
      houseAssignments,
    );
  }

  private static calculateCourtFees(estateValue: number): number {
    // Simplified court fee calculation based on Kenyan law
    if (estateValue <= 1000000) return 5000;
    if (estateValue <= 5000000) return 10000;
    if (estateValue <= 10000000) return 25000;
    if (estateValue <= 50000000) return 50000;
    if (estateValue <= 100000000) return 100000;
    return 200000 + estateValue * 0.001; // 0.1% for amounts above 100M
  }

  private static generateRecommendations(
    analysis: SuccessionAnalysis,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
  ): void {
    const deceasedId = analysis.distribution ? (analysis.distribution as any).deceasedId : null;

    if (!deceasedId) return;

    const nodes = FamilyTreeBuilder.buildTree(members, relationships);
    const deceasedNode = nodes.get(deceasedId);

    if (!deceasedNode) return;

    // Check for minors
    const minorChildren = deceasedNode.children.filter((childNode) => {
      const child = members.find((m) => m.id === childNode.memberId);
      return child && child.isMinor;
    });

    if (minorChildren.length > 0) {
      analysis.recommendations.push(
        `Appoint guardian(s) for ${minorChildren.length} minor child(ren) under S.70-73 LSA`,
      );
    }

    // Check for dependants
    const dependants = members.filter(
      (m) => m.isPotentialDependant && !m.isDeceased && m.id !== deceasedId,
    );

    if (dependants.length > 0) {
      analysis.recommendations.push(
        `Consider dependant provision applications under S.26-29 for ${dependants.length} potential dependant(s)`,
      );
    }

    // Check for disputes
    const contestedRelationships = relationships.filter((rel) => rel.isContested);
    if (contestedRelationships.length > 0) {
      analysis.recommendations.push(
        `Resolve ${contestedRelationships.length} contested relationship(s) before distribution`,
      );
      analysis.warnings.push('Contested relationships may delay succession process');
    }

    // Estate administration
    analysis.recommendations.push(
      'File inventory of assets within 90 days of grant issuance (S.83(1)(a))',
      'Obtain tax clearance certificate from KRA',
      'Consider professional executor for complex estates',
    );

    if (analysis.applicableSection === 'S.40') {
      analysis.recommendations.push(
        'Ensure equal distribution among polygamous houses as per S.40',
        'Consider customary law implications for each house',
        'Document house assignments clearly for court submission',
      );
    }
  }

  static generateSuccessionReport(
    analysis: SuccessionAnalysis,
    members: FamilyMember[],
    relationships: FamilyRelationship[],
  ): any {
    const report = {
      analysis,
      familySummary: {
        totalMembers: members.length,
        deceasedCount: members.filter((m) => m.isDeceased).length,
        minorCount: members.filter((m) => m.isMinor).length,
        dependantCount: members.filter((m) => m.isPotentialDependant).length,
        contestedRelationships: relationships.filter((r) => r.isContested).length,
      },
      timeline: {
        immediateActions: [
          'Secure estate assets',
          'Notify family members',
          'File for grant of letters of administration',
        ],
        shortTermActions: [
          'Publish gazette notice',
          'File inventory of assets',
          'Pay funeral expenses and debts',
        ],
        mediumTermActions: [
          'Distribute estate according to LSA',
          'File estate accounts',
          'Obtain discharge from court',
        ],
      },
      legalRequirements: [
        'Form P&A 80 (Letters of Administration)',
        'Death certificate',
        'ID copies of deceased and applicants',
        'List of survivors with IDs',
        'Inventory of assets with values',
        'Affidavit of justification',
      ],
    };

    if (analysis.applicableSection === 'S.40') {
      report.legalRequirements.push(
        'S.40 certificate or proof of polygamous marriage',
        'List of houses and members per house',
        'Consent from all houses (if possible)',
      );
    }

    return report;
  }
}
