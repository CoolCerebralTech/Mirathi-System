// src/domain/services/guardianship-eligibility.service.ts
import { Injectable } from '@nestjs/common';

import { GuardianAssignmentEntity } from '../entities/guardian-assignment.entity';
import { GuardianshipTypeVO } from '../value-objects/guardianship-type.vo';
import { LegalGuardianshipType } from '../value-objects/guardianship-type.vo';

export interface EligibilityCriteria {
  age: number;
  mentalCapacity: boolean;
  criminalRecord: boolean;
  financialStability: boolean;
  relationshipToWard: string;
  residencyStatus: 'CITIZEN' | 'RESIDENT' | 'NON_RESIDENT';
  hasConflictOfInterest: boolean;
  physicalAbility: boolean;
  educationalBackground?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  score: number; // 0-100
  reasons: string[];
  recommendations: string[];
  legalRestrictions: string[];
  warnings: string[];
  requiredDocuments: string[];
  nextSteps: string[];
}

export interface GuardianRoleEligibility {
  role: string;
  isEligible: boolean;
  specificRequirements: string[];
  metRequirements: string[];
  unmetRequirements: string[];
}

@Injectable()
export class GuardianshipEligibilityService {
  // 🎯 INNOVATIVE: Kenyan Law-based eligibility rules
  private readonly KENYAN_LAW_RULES = {
    MIN_AGE: 18,
    MAX_AGE: 70, // Can be waived by court
    MIN_AGE_DIFFERENCE: 18, // Guardian must be at least 18 years older than ward
    RESIDENCY_REQUIREMENT: 'CITIZEN_OR_RESIDENT',
    DISQUALIFYING_CRIMES: [
      'CHILD_ABUSE',
      'SEXUAL_OFFENSE',
      'FRAUD',
      'VIOLENT_CRIME',
      'DRUG_TRAFFICKING',
    ],
    FINANCIAL_THRESHOLD: 50000, // KES minimum monthly income for property guardians
  };

  /**
   * 🎯 INNOVATIVE: Comprehensive eligibility check for potential guardian
   */
  public async checkGuardianEligibility(
    candidate: any, // FamilyMember or User
    ward: any, // FamilyMember
    guardianshipType: GuardianshipTypeVO,
    requestedRole: string,
  ): Promise<EligibilityResult> {
    const criteria = this.extractEligibilityCriteria(candidate, ward);
    const baseEligibility = this.checkBaseEligibility(criteria);
    const roleEligibility = this.checkRoleEligibility(criteria, requestedRole, guardianshipType);
    const legalEligibility = this.checkLegalRestrictions(candidate, ward);

    // Calculate overall score
    const score = this.calculateEligibilityScore(
      baseEligibility,
      roleEligibility,
      legalEligibility,
    );

    const isEligible = score >= 70 && !legalEligibility.hasDisqualifyingFactors;

    return {
      isEligible,
      score,
      reasons: [
        ...baseEligibility.reasons,
        ...roleEligibility.reasons,
        ...legalEligibility.reasons,
      ],
      recommendations: this.generateRecommendations(
        criteria,
        baseEligibility,
        roleEligibility,
        legalEligibility,
      ),
      legalRestrictions: legalEligibility.restrictions,
      warnings: this.generateWarnings(criteria),
      requiredDocuments: this.getRequiredDocuments(guardianshipType, requestedRole, criteria),
      nextSteps: this.generateNextSteps(isEligible, score, criteria),
    };
  }

  /**
   * 🎯 INNOVATIVE: Check if person can be appointed as multiple types of guardian
   */
  public async checkMultiRoleEligibility(
    candidate: any,
    ward: any,
    requestedRoles: string[],
  ): Promise<GuardianRoleEligibility[]> {
    const criteria = this.extractEligibilityCriteria(candidate, ward);
    const results: GuardianRoleEligibility[] = [];

    for (const role of requestedRoles) {
      const roleEligibility = this.checkRoleEligibility(criteria, role);
      const baseEligibility = this.checkBaseEligibility(criteria);

      results.push({
        role,
        isEligible: roleEligibility.isEligible && baseEligibility.isEligible,
        specificRequirements: this.getRoleSpecificRequirements(role),
        metRequirements: [
          ...(baseEligibility.metRequirements || []),
          ...(roleEligibility.metRequirements || []),
        ],
        unmetRequirements: [
          ...(baseEligibility.unmetRequirements || []),
          ...(roleEligibility.unmetRequirements || []),
        ],
      });
    }

    return results;
  }

  /**
   * 🎯 INNOVATIVE: Check for conflicts of interest
   */
  public async checkConflictsOfInterest(
    candidate: any,
    ward: any,
    existingGuardians: GuardianAssignmentEntity[] = [],
  ): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      mitigation: string;
    }>;
    riskScore: number; // 0-100
  }> {
    const conflicts: Array<any> = [];

    // 1. Financial conflicts
    const financialConflicts = this.checkFinancialConflicts(candidate, ward);
    if (financialConflicts.hasConflicts) {
      conflicts.push(...financialConflicts.conflicts);
    }

    // 2. Relationship conflicts
    const relationshipConflicts = this.checkRelationshipConflicts(candidate, ward);
    if (relationshipConflicts.hasConflicts) {
      conflicts.push(...relationshipConflicts.conflicts);
    }

    // 3. Existing guardian conflicts
    const existingConflicts = this.checkExistingGuardianConflicts(candidate, existingGuardians);
    if (existingConflicts.hasConflicts) {
      conflicts.push(...existingConflicts.conflicts);
    }

    // 4. Legal conflicts
    const legalConflicts = this.checkLegalConflicts(candidate);
    if (legalConflicts.hasConflicts) {
      conflicts.push(...legalConflicts.conflicts);
    }

    // Calculate risk score
    const riskScore = this.calculateConflictRiskScore(conflicts);

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      riskScore,
    };
  }

  /**
   * 🎯 INNOVATIVE: Emergency guardian eligibility (relaxed rules)
   */
  public async checkEmergencyEligibility(
    candidate: any,
    ward: any,
    emergencyType: 'MEDICAL' | 'TRAVEL' | 'FAMILY_CRISIS',
  ): Promise<{
    isEligible: boolean;
    durationLimit: number; // Days
    restrictions: string[];
    temporaryPowers: string[];
  }> {
    const baseCriteria = this.extractEligibilityCriteria(candidate, ward);

    // Emergency rules are more flexible
    const emergencyRules = {
      MIN_AGE: 21,
      MAX_AGE: null, // No upper limit in emergency
      RESIDENCY_REQUIREMENT: 'ANY',
      DISQUALIFYING_CRIMES: ['CHILD_ABUSE', 'SEXUAL_OFFENSE'], // Only most serious crimes
    };

    const isEligible = this.checkEmergencyBaseEligibility(baseCriteria, emergencyRules);

    return {
      isEligible,
      durationLimit: this.getEmergencyDurationLimit(emergencyType),
      restrictions: this.getEmergencyRestrictions(emergencyType, candidate),
      temporaryPowers: this.getEmergencyPowers(emergencyType),
    };
  }

  /**
   * 🎯 INNOVATIVE: Customary law eligibility check
   */
  public async checkCustomaryEligibility(
    candidate: any,
    ward: any,
    clanRules: {
      clanName: string;
      subClan?: string;
      customaryRequirements: string[];
    },
  ): Promise<{
    isEligible: boolean;
    clanApprovalRequired: boolean;
    elderCouncilApproval: boolean;
    customaryRequirements: string[];
    unmetCustomaryRequirements: string[];
    ritualRequirements: string[];
  }> {
    // Check statutory eligibility first
    const statutoryEligibility = await this.checkGuardianEligibility(
      candidate,
      ward,
      GuardianshipTypeVO.create(LegalGuardianshipType.CUSTOMARY),
      'CUSTOMARY_GUARDIAN',
    );

    // Check clan-specific rules
    const clanEligibility = this.checkClanEligibility(candidate, ward, clanRules);

    return {
      isEligible: statutoryEligibility.isEligible && clanEligibility.isEligible,
      clanApprovalRequired: clanEligibility.requiresClanApproval,
      elderCouncilApproval: clanEligibility.requiresElderApproval,
      customaryRequirements: clanRules.customaryRequirements,
      unmetCustomaryRequirements: clanEligibility.unmetRequirements,
      ritualRequirements: clanEligibility.ritualRequirements,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private extractEligibilityCriteria(candidate: any, ward: any): EligibilityCriteria {
    // In real implementation, this would extract from candidate and ward entities
    return {
      age: candidate.dateOfBirth ? this.calculateAge(candidate.dateOfBirth) : 0,
      mentalCapacity: candidate.mentalCapacity || true,
      criminalRecord: candidate.hasCriminalRecord || false,
      financialStability: this.assessFinancialStability(candidate),
      relationshipToWard: this.determineRelationship(candidate, ward),
      residencyStatus: candidate.residencyStatus || 'CITIZEN',
      hasConflictOfInterest: false, // To be determined
      physicalAbility: candidate.physicalAbility || true,
      educationalBackground: candidate.educationalBackground,
    };
  }

  private checkBaseEligibility(criteria: EligibilityCriteria): {
    isEligible: boolean;
    reasons: string[];
    metRequirements: string[];
    unmetRequirements: string[];
  } {
    const reasons: string[] = [];
    const metRequirements: string[] = [];
    const unmetRequirements: string[] = [];

    // Age check
    if (criteria.age >= this.KENYAN_LAW_RULES.MIN_AGE) {
      metRequirements.push(`Minimum age of ${this.KENYAN_LAW_RULES.MIN_AGE} met`);
    } else {
      unmetRequirements.push(`Must be at least ${this.KENYAN_LAW_RULES.MIN_AGE} years old`);
      reasons.push(`Candidate is only ${criteria.age} years old`);
    }

    // Mental capacity
    if (criteria.mentalCapacity) {
      metRequirements.push('Mental capacity confirmed');
    } else {
      unmetRequirements.push('Must have mental capacity');
      reasons.push('Candidate lacks mental capacity');
    }

    // Criminal record
    if (!criteria.criminalRecord) {
      metRequirements.push('No disqualifying criminal record');
    } else {
      unmetRequirements.push('Cannot have disqualifying criminal record');
      reasons.push('Candidate has disqualifying criminal record');
    }

    // Financial stability for certain roles
    if (criteria.financialStability) {
      metRequirements.push('Financially stable');
    } else {
      unmetRequirements.push('Must be financially stable for property management');
      reasons.push('Candidate may not be financially stable');
    }

    const isEligible = unmetRequirements.length === 0;

    return { isEligible, reasons, metRequirements, unmetRequirements };
  }

  private checkRoleEligibility(
    criteria: EligibilityCriteria,
    role: string,
    guardianshipType?: GuardianshipTypeVO,
  ): {
    isEligible: boolean;
    reasons: string[];
    metRequirements: string[];
    unmetRequirements: string[];
  } {
    const roleRequirements = this.getRoleSpecificRequirements(role);
    const metRequirements: string[] = [];
    const unmetRequirements: string[] = [];
    const reasons: string[] = [];

    switch (role) {
      case 'PROPERTY_MANAGER':
        if (criteria.financialStability) {
          metRequirements.push('Financially qualified for property management');
        } else {
          unmetRequirements.push('Must demonstrate financial stability');
          reasons.push('Insufficient financial stability for property management');
        }

        if (criteria.educationalBackground) {
          metRequirements.push('Educational background suitable for property management');
        } else {
          unmetRequirements.push('Should have relevant education or experience');
        }
        break;

      case 'MEDICAL_CONSENT':
        if (criteria.relationshipToWard === 'PARENT' || criteria.relationshipToWard === 'SPOUSE') {
          metRequirements.push('Close relationship suitable for medical decisions');
        } else {
          unmetRequirements.push('Should have close relationship for medical decisions');
          reasons.push('May need special authorization for medical consent');
        }
        break;

      case 'EDUCATIONAL_GUARDIAN':
        if (criteria.educationalBackground) {
          metRequirements.push('Educational background suitable for educational decisions');
        }
        // No strict requirements
        break;

      case 'EMERGENCY':
        // Emergency guardians have relaxed requirements
        metRequirements.push('Emergency guardian - relaxed requirements apply');
        break;
    }

    // Additional checks based on guardianship type
    if (guardianshipType) {
      if (guardianshipType.getValue().value === LegalGuardianshipType.COURT_APPOINTED) {
        unmetRequirements.push('Requires court approval');
        reasons.push('Court-appointed guardians require judicial approval');
      }
    }

    const isEligible = unmetRequirements.length === 0;

    return { isEligible, reasons, metRequirements, unmetRequirements };
  }

  private checkLegalRestrictions(
    candidate: any,
    ward: any,
  ): {
    hasDisqualifyingFactors: boolean;
    restrictions: string[];
    reasons: string[];
  } {
    const restrictions: string[] = [];
    const reasons: string[] = [];
    let hasDisqualifyingFactors = false;

    // Check if candidate is ward's creditor (potential conflict)
    if (this.isCreditor(candidate, ward)) {
      restrictions.push('Cannot be guardian if also a significant creditor');
      reasons.push('Potential conflict of interest as creditor');
      hasDisqualifyingFactors = true;
    }

    // Check if candidate has been removed as guardian before
    if (candidate.previouslyRemovedAsGuardian) {
      restrictions.push('Previously removed as guardian');
      reasons.push('History of guardianship removal');
      hasDisqualifyingFactors = true;
    }

    // Check if candidate is in legal dispute with ward
    if (this.hasLegalDispute(candidate, ward)) {
      restrictions.push('Cannot be guardian while in legal dispute with ward');
      reasons.push('Ongoing legal dispute with ward');
      hasDisqualifyingFactors = true;
    }

    return { hasDisqualifyingFactors, restrictions, reasons };
  }

  private calculateEligibilityScore(
    baseEligibility: any,
    roleEligibility: any,
    legalEligibility: any,
  ): number {
    let score = 100;

    // Deduct for unmet base requirements
    score -= baseEligibility.unmetRequirements.length * 15;

    // Deduct for unmet role requirements
    score -= roleEligibility.unmetRequirements.length * 10;

    // Deduct for legal restrictions
    if (legalEligibility.hasDisqualifyingFactors) {
      score -= 50;
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    criteria: EligibilityCriteria,
    ..._eligibilityChecks: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Age-related recommendations
    if (criteria.age < 25) {
      recommendations.push('Consider appointing a co-guardian with more experience');
    }

    if (criteria.age > 65) {
      recommendations.push('Consider appointing a successor guardian');
    }

    // Financial recommendations
    if (!criteria.financialStability) {
      recommendations.push('Provide proof of income or assets');
      recommendations.push('Consider a bond or surety');
    }

    // Relationship recommendations
    if (!['PARENT', 'SPOUSE', 'SIBLING'].includes(criteria.relationshipToWard)) {
      recommendations.push('Obtain family consent for distant relative guardianship');
    }

    // Legal recommendations
    if (criteria.residencyStatus === 'NON_RESIDENT') {
      recommendations.push('Obtain special court permission for non-resident guardian');
    }

    return recommendations;
  }

  private getRequiredDocuments(
    guardianshipType: GuardianshipTypeVO,
    role: string,
    _criteria: EligibilityCriteria,
  ): string[] {
    const documents = [
      'National ID',
      'Passport-size photo',
      'Police clearance certificate',
      'Proof of residence',
    ];

    // Additional documents based on role
    if (role === 'PROPERTY_MANAGER') {
      documents.push('Bank statements (last 6 months)');
      documents.push('Credit report');
      documents.push('Asset declaration');
    }

    if (role === 'MEDICAL_CONSENT') {
      documents.push('Medical training certificate (if any)');
    }

    // Documents based on guardianship type
    switch (guardianshipType.getValue().value) {
      case LegalGuardianshipType.COURT_APPOINTED:
        documents.push('Court application forms');
        documents.push('Affidavit of means');
        break;
      case LegalGuardianshipType.CUSTOMARY:
        documents.push('Clan elder recommendation letter');
        documents.push('Customary ceremony affidavit');
        break;
      case LegalGuardianshipType.TESTAMENTARY:
        documents.push('Will or codicil');
        documents.push('Death certificate of testator');
        break;
    }

    return documents;
  }

  private generateNextSteps(
    isEligible: boolean,
    score: number,
    _criteria: EligibilityCriteria,
  ): string[] {
    const nextSteps: string[] = [];

    if (isEligible) {
      if (score >= 90) {
        nextSteps.push('Proceed with full appointment');
        nextSteps.push('Schedule bond posting (if required)');
      } else if (score >= 70) {
        nextSteps.push('Proceed with conditional appointment');
        nextSteps.push('Address recommendations within 30 days');
        nextSteps.push('Schedule court hearing (if required)');
      }
    } else {
      nextSteps.push('Address eligibility issues before proceeding');
      nextSteps.push('Consider alternative guardian candidates');
      nextSteps.push('Consult with legal advisor');
    }

    return nextSteps;
  }

  private checkFinancialConflicts(
    candidate: any,
    _ward: any,
  ): {
    hasConflicts: boolean;
    conflicts: any[];
  } {
    const conflicts: any[] = [];

    // Check if candidate owes money to ward
    if (candidate.owesMoneyToWard) {
      conflicts.push({
        type: 'FINANCIAL_DEBT',
        severity: 'HIGH',
        description: `Candidate owes KES ${candidate.debtAmount} to ward`,
        mitigation: 'Clear debt before appointment or recuse from financial decisions',
      });
    }

    // Check if candidate stands to inherit from ward
    if (candidate.isBeneficiaryOfWard) {
      conflicts.push({
        type: 'INHERITANCE_CONFLICT',
        severity: 'MEDIUM',
        description: "Candidate is named beneficiary in ward's will",
        mitigation: 'Consider limited guardianship or independent oversight',
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  private checkRelationshipConflicts(
    candidate: any,
    ward: any,
  ): {
    hasConflicts: boolean;
    conflicts: any[];
  } {
    const conflicts: any[] = [];
    const relationship = this.determineRelationship(candidate, ward);

    // Check for problematic relationships
    const problematicRelationships = [
      'EX_SPOUSE',
      'STEP_PARENT_WITH_CONFLICT',
      'DISTANT_RELATIVE_WITH_HISTORY',
    ];

    if (problematicRelationships.includes(relationship)) {
      conflicts.push({
        type: 'RELATIONSHIP_CONFLICT',
        severity: 'MEDIUM',
        description: `Relationship type (${relationship}) may cause conflicts`,
        mitigation: 'Family mediation or court supervision recommended',
      });
    }

    // Check for history of conflict
    if (candidate.hasHistoryOfConflictWithWard) {
      conflicts.push({
        type: 'HISTORICAL_CONFLICT',
        severity: 'HIGH',
        description: 'History of conflict between candidate and ward',
        mitigation: 'Requires family counseling or court assessment',
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  private calculateConflictRiskScore(conflicts: any[]): number {
    if (conflicts.length === 0) return 0;

    const severityWeights = {
      LOW: 1,
      MEDIUM: 3,
      HIGH: 6,
      CRITICAL: 10,
    };

    const totalScore = conflicts.reduce((sum, conflict) => {
      return sum + (severityWeights[conflict.severity] || 1);
    }, 0);

    // Normalize to 0-100 scale
    return Math.min(100, totalScore * 10);
  }

  // Utility methods (simplified for example)
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private assessFinancialStability(candidate: any): boolean {
    // Simplified - in real implementation would check income, assets, debts
    return candidate.monthlyIncome >= 50000 && candidate.totalAssets >= 1000000;
  }

  private determineRelationship(candidate: any, _ward: any): string {
    // Simplified - in real implementation would use family graph
    return candidate.relationshipToWard || 'UNKNOWN';
  }

  private isCreditor(candidate: any, _ward: any): boolean {
    return candidate.isCreditorOfWard || false;
  }

  private hasLegalDispute(candidate: any, _ward: any): boolean {
    return candidate.hasLegalDisputeWithWard || false;
  }

  private getRoleSpecificRequirements(role: string): string[] {
    const requirements: Record<string, string[]> = {
      PROPERTY_MANAGER: [
        'Minimum monthly income of KES 50,000',
        'No history of bankruptcy',
        'Clean credit report',
        'Basic financial literacy',
      ],
      MEDICAL_CONSENT: [
        'Close family relationship',
        'Understanding of medical terminology',
        'Availability for medical emergencies',
      ],
      EDUCATIONAL_GUARDIAN: [
        'Minimum secondary education',
        'Understanding of education system',
        'Ability to attend school meetings',
      ],
      EMERGENCY: [
        'Available on short notice',
        'Basic first aid knowledge',
        'Emergency contact information',
      ],
    };

    return requirements[role] || [];
  }

  private checkEmergencyBaseEligibility(criteria: EligibilityCriteria, rules: any): boolean {
    // Emergency eligibility is more lenient
    if (criteria.age < rules.MIN_AGE) return false;
    if (criteria.criminalRecord) return false; // Still no serious crimes
    if (!criteria.mentalCapacity) return false;

    return true;
  }

  private getEmergencyDurationLimit(emergencyType: string): number {
    const limits: Record<string, number> = {
      MEDICAL: 30, // 30 days for medical emergencies
      TRAVEL: 90, // 90 days for travel
      FAMILY_CRISIS: 60, // 60 days for family crisis
    };

    return limits[emergencyType] || 30;
  }

  private getEmergencyRestrictions(emergencyType: string, _candidate: any): string[] {
    const restrictions: string[] = [
      "Cannot sell or mortgage ward's property",
      'Major medical decisions require second opinion',
      'Must report to court within 7 days of appointment',
    ];

    if (emergencyType === 'TRAVEL') {
      restrictions.push('Limited to care decisions only');
      restrictions.push("Cannot change ward's residence");
    }

    return restrictions;
  }

  private getEmergencyPowers(emergencyType: string): string[] {
    const powers: Record<string, string[]> = {
      MEDICAL: [
        'Consent to emergency medical treatment',
        'Access medical records',
        'Make hospital visitation decisions',
      ],
      TRAVEL: [
        'Provide daily care',
        'Make educational decisions',
        'Handle routine medical appointments',
      ],
      FAMILY_CRISIS: ['Temporary custody', 'Basic care decisions', 'Emergency medical consent'],
    };

    return powers[emergencyType] || [];
  }

  private checkClanEligibility(
    candidate: any,
    _ward: any,
    clanRules: any,
  ): {
    isEligible: boolean;
    requiresClanApproval: boolean;
    requiresElderApproval: boolean;
    unmetRequirements: string[];
    ritualRequirements: string[];
  } {
    // Simplified clan eligibility check
    const unmetRequirements: string[] = [];
    const ritualRequirements: string[] = [];

    // Check if candidate is from same clan
    if (candidate.clanName !== clanRules.clanName) {
      unmetRequirements.push('Must be from the same clan');
    }

    // Check if candidate is appropriate gender (some clans have gender rules)
    if (clanRules.requiresMaleGuardian && candidate.gender !== 'MALE') {
      unmetRequirements.push('Clan requires male guardian');
    }

    // Check age requirements
    if (clanRules.minClanAge && candidate.age < clanRules.minClanAge) {
      unmetRequirements.push(`Clan requires minimum age of ${clanRules.minClanAge}`);
    }

    // Determine if rituals are required
    if (clanRules.requiresInitiation) {
      ritualRequirements.push('Clan initiation ceremony required');
    }

    if (clanRules.requiresBlessing) {
      ritualRequirements.push('Elder blessing ceremony required');
    }

    const isEligible = unmetRequirements.length === 0;

    return {
      isEligible,
      requiresClanApproval: true,
      requiresElderApproval: clanRules.requiresElderApproval || false,
      unmetRequirements,
      ritualRequirements,
    };
  }

  private checkExistingGuardianConflicts(
    candidate: any,
    existingGuardians: GuardianAssignmentEntity[],
  ): {
    hasConflicts: boolean;
    conflicts: any[];
  } {
    const conflicts: any[] = [];

    // Check if candidate has conflict with existing guardians
    existingGuardians.forEach((existing) => {
      if (this.hasPersonalConflict(candidate, existing.props.guardianId)) {
        conflicts.push({
          type: 'PERSONAL_CONFLICT',
          severity: 'MEDIUM',
          description: `Personal conflict with existing guardian: ${existing.props.guardianName}`,
          mitigation: 'Mediation required or consider alternative candidate',
        });
      }

      // Check for overlapping roles
      if (this.hasRoleOverlap(candidate.requestedRole, existing.props.role)) {
        conflicts.push({
          type: 'ROLE_OVERLAP',
          severity: 'LOW',
          description: `Role overlap with existing guardian: ${existing.props.role}`,
          mitigation: 'Define clear role boundaries',
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  private checkLegalConflicts(candidate: any): {
    hasConflicts: boolean;
    conflicts: any[];
  } {
    const conflicts: any[] = [];

    // Check if candidate is facing legal charges
    if (candidate.pendingLegalCharges) {
      conflicts.push({
        type: 'PENDING_LEGAL_CHARGES',
        severity: 'HIGH',
        description: 'Candidate is facing pending legal charges',
        mitigation: 'Defer appointment until charges resolved',
      });
    }

    // Check if candidate is in another legal role that conflicts
    if (candidate.isExecutorOfAnotherEstate) {
      conflicts.push({
        type: 'MULTIPLE_LEGAL_ROLES',
        severity: 'MEDIUM',
        description: 'Candidate already serves as executor in another estate',
        mitigation: 'Assess capacity to handle multiple responsibilities',
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  private hasPersonalConflict(_candidate: any, _guardianId: string): boolean {
    // Simplified - would check conflict database
    return false;
  }

  private hasRoleOverlap(requestedRole: string, existingRole: string): boolean {
    const roleGroups: Record<string, string[]> = {
      PROPERTY: ['PROPERTY_MANAGER', 'FINANCIAL_GUARDIAN'],
      CARE: ['CARETAKER', 'MEDICAL_CONSENT', 'EDUCATIONAL_GUARDIAN'],
      LEGAL: ['LEGAL_REPRESENTATIVE', 'COURT_LIAISON'],
    };

    // Check if roles are in same group
    for (const group of Object.values(roleGroups)) {
      if (group.includes(requestedRole) && group.includes(existingRole)) {
        return true;
      }
    }

    return false;
  }
}
