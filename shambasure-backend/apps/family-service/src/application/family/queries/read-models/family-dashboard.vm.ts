import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

/**
 * View Model for the Family Home Screen.
 *
 * Investor Note:
 * This provides the "Health Check" of the family tree at a glance.
 */
export interface FamilyDashboardVM {
  familyId: string;
  name: string;
  description?: string;

  // Cultural Context
  county: KenyanCounty | string;
  clanName?: string;

  // Quick Stats
  stats: {
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number; // Critical for Succession
    verifiedMembers: number; // KYC/KYM Status
    generationsCount: number;
  };

  // Structural Status
  structure: {
    type: 'NUCLEAR' | 'EXTENDED' | 'POLYGAMOUS' | 'SINGLE_PARENT';
    houseCount: number; // For Polygamy (S.40)
    isS40Compliant: boolean; // Are houses defined if polygamous?
  };

  // Recent Activity (Audit Trail Lite)
  recentEvents: Array<{
    date: Date;
    description: string;
    actorName: string; // Who did it?
    type: 'BIRTH' | 'MARRIAGE' | 'DEATH' | 'UPDATE';
  }>;

  // Gamification / Completion
  completenessScore: number; // 0-100%
  nextAction?: string; // e.g., "Add your father to complete the tree"
}
