/**
 * The "Digital Lawyer" Report.
 * Explains WHY the family is (or isn't) ready for legal succession.
 */
export interface SuccessionReadinessVM {
  familyId: string;
  generatedAt: Date;

  // Overall Readiness Score
  overallScore: number; // 0-100
  readinessLevel: 'NOT_READY' | 'PARTIAL' | 'READY_TO_FILE';

  // Section 29 Analysis (Dependents)
  dependencyAnalysis: {
    status: 'PASS' | 'WARNING' | 'FAIL';
    potentialClaimantsCount: number; // Minors, Elderly, Disabled
    issues: string[]; // e.g., "Minor child [Name] has no designated Guardian"
  };

  // Section 40 Analysis (Polygamy)
  polygamyAnalysis: {
    isPolygamous: boolean;
    status: 'NOT_APPLICABLE' | 'PASS' | 'FAIL';
    definedHouses: number;
    issues: string[]; // e.g., "2nd Wife has no House assigned"
  };

  // Identity Verification
  dataIntegrity: {
    verifiedMembersPercentage: number;
    missingCriticalDocuments: string[]; // e.g., "Deceased Head has no Death Certificate"
  };

  // Actionable Advice
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    actionLink?: string; // Deep link to the command (e.g. "/family/verify/123")
  }>;
}
