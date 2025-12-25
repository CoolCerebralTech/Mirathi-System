/**
 * View Model for the Family Home Screen.
 *
 * Investor Note:
 * This provides the "Health Check" of the family tree at a glance.
 * It drives the main landing page after login.
 */
export interface FamilyDashboardVM {
  familyId: string;
  name: string;
  description?: string;

  // Cultural Context
  county: string; // Stores KenyanCounty enum value or custom string
  clanName?: string;
  totem?: string;

  // Quick Stats
  stats: {
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number; // Critical for Succession triggers
    verifiedMembers: number; // KYC/KYM Status
    generationsCount: number;

    // S.29 Dependency Snapshot
    potentialDependents: number; // Minors + Students + Disabled
  };

  // Structural Status (S.40 & Customary Law)
  structure: {
    type: 'NUCLEAR' | 'EXTENDED' | 'POLYGAMOUS' | 'SINGLE_PARENT' | 'UNKNOWN';
    houseCount: number; // For Polygamy (S.40)
    isS40Compliant: boolean; // True if (Polygamous == Houses Defined)
    polygamyStatus: 'MONOGAMOUS' | 'POLYGAMOUS' | 'POTENTIALLY_POLYGAMOUS';
  };

  // Succession Readiness Index (The "Digital Lawyer" Score)
  successionReadiness: {
    score: number; // 0-100
    status: 'READY' | 'NEEDS_WORK' | 'CRITICAL_GAPS';
    missingKeyDocuments: number; // e.g. Missing Birth Certs, IDs
    issues: string[]; // e.g. ["3 Members missing DOB", "Polygamous house undefined"]
  };

  // Recent Activity (Audit Trail Lite)
  recentEvents: Array<{
    eventId: string;
    date: Date;
    description: string;
    actorName: string; // Who did it?
    type: 'BIRTH' | 'MARRIAGE' | 'DEATH' | 'UPDATE' | 'LEGAL';
  }>;

  // Gamification / Completion
  completeness: {
    score: number; // 0-100%
    missingFieldsCount: number;
    nextRecommendedAction?: {
      title: string;
      route: string; // e.g., "/family/add-member"
      reason: string;
    };
  };
}
