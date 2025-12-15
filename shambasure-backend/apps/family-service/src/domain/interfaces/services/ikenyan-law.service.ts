import { FamilyMember } from '../../entities/family-member.entity';
import { LegalDependant } from '../../entities/legal-dependant.entity';
import { Marriage } from '../../entities/marriage.entity';

export interface IKenyanLawService {
  // S.29 Dependant Determination
  determineDependantStatus(member: FamilyMember): Promise<{
    isDependant: boolean;
    dependencyLevel: string;
    basis: string[];
  }>;

  calculateDependencyPercentage(
    dependant: LegalDependant,
    deceasedIncome?: number,
  ): Promise<number>;

  // S.35 Intestate Succession
  calculateIntestateShares(family: {
    deceasedId: string;
    spouseId?: string;
    childrenIds: string[];
    polygamousHouses?: Array<{
      houseId: string;
      spouseId: string;
      childrenIds: string[];
    }>;
    parentsAlive?: boolean;
    siblingsExist?: boolean;
  }): Promise<Map<string, number>>; // memberId -> share percentage

  // S.40 Polygamous Succession
  calculatePolygamousShares(family: {
    deceasedId: string;
    houses: Array<{
      houseId: string;
      spouseId: string;
      childrenIds: string[];
    }>;
    totalEstateValue: number;
  }): Promise<Map<string, number>>; // houseId/memberId -> share percentage

  // S.70-73 Guardianship
  validateGuardianAppointment(guardian: {
    guardianId: string;
    wardId: string;
    type: string;
  }): Promise<{
    eligible: boolean;
    requirements: string[];
    restrictions: string[];
  }>;

  calculateGuardianBondAmount(wardAssetsValue: number): Promise<number>;

  // Marriage Validity (various laws)
  validateMarriage(marriage: Marriage): Promise<{
    isValid: boolean;
    lawApplied: string;
    issues: string[];
  }>;

  // Customary Law Applications
  applyCustomaryLaw(family: {
    ethnicGroup: string;
    clan: string;
    situation: string; // 'inheritance', 'marriage', 'guardianship'
  }): Promise<{
    applicable: boolean;
    rules: object;
  }>;

  // Age of Majority (Children Act)
  isAgeOfMajorityReached(birthDate: Date, context?: string): Promise<boolean>;

  // Islamic Law Applications
  applyIslamicLaw(family: {
    muslimMembers: string[];
    situation: string;
    estateValue?: number;
  }): Promise<{
    applicable: boolean;
    distribution: Map<string, number>;
  }>;

  // Court Procedure Compliance
  validateCourtProcedure(procedure: {
    type: string; // 'guardianship', 'adoption', 'dependency'
    documents: string[];
    parties: string[];
  }): Promise<{
    compliant: boolean;
    missingRequirements: string[];
  }>;

  // Statutory Time Limits
  calculateTimeLimits(situation: {
    type: string; // 'claim', 'appeal', 'filing'
    triggerDate: Date;
  }): Promise<{
    deadline: Date;
    isOverdue: boolean;
    daysRemaining: number;
  }>;
}
