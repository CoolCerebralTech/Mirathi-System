import { Gender, KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

/**
 * Detailed 360-degree Profile View for a single family member.
 *
 * Investor Note:
 * This view consolidates data from multiple sources (Identity, Kinship Graph, Legal Status)
 * into one payload. It is designed to answer "Who is this person in the eyes of the Law?"
 * without requiring multiple API calls.
 */
export interface FamilyMemberProfileVM {
  id: string;
  familyId: string;

  // 1. Core Identity
  identity: {
    fullName: string;
    officialName: string; // Format: "SURNAME, First Name Middle" (for legal docs)
    first: string;
    last: string;
    otherNames?: string[];
    gender: Gender;
    dateOfBirth?: Date;
    age?: number;
    nationalId?: string;
  };

  // 2. Life & Vital Status
  vitalStatus: {
    isAlive: boolean;
    dateOfDeath?: Date;
    placeOfDeath?: string;
    isMissing: boolean;
  };

  // 3. Cultural & Location Context
  context: {
    tribe?: string;
    clan?: string; // Fallback to Family Clan if personal clan not set
    subClan?: string;
    homeCounty?: KenyanCounty;
    placeOfBirth?: string;
  };

  // 4. Verification Status (KYC)
  verification: {
    isVerified: boolean;
    status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FLAGGED';
    method?: string; // e.g. "IPRS_CHECK", "MANUAL_UPLOAD", "TRUSTED_AGENT"
    confidenceScore?: number; // 0-100
    notes?: string;
  };

  // 5. Immediate Kinship (The "One-Hop" Graph)
  kinship: {
    parents: Array<{
      id: string;
      name: string;
      relationshipType: 'BIOLOGICAL' | 'ADOPTIVE' | 'FOSTER' | 'STEP';
      isAlive: boolean;
    }>;

    spouses: Array<{
      id: string;
      name: string;
      marriageType: string; // "CIVIL", "CUSTOMARY", "ISLAMIC"
      status: string; // "MARRIED", "SEPARATED", "WIDOWED"
      dateOfMarriage?: Date;
    }>;

    children: Array<{
      id: string;
      name: string;
      gender: Gender;
      age?: number;
      relationshipType: 'BIOLOGICAL' | 'ADOPTED' | 'STEP'; // Crucial for inheritance
    }>;

    siblings: Array<{
      id: string;
      name: string;
      type: 'FULL' | 'HALF' | 'STEP'; // "Half-sibling" implies different mother/house (S.40 relevance)
    }>;
  };

  // 6. Section 40 Context (Polygamy)
  // Essential for calculating inheritance shares in polygamous families
  polygamyContext: {
    isPolygamousFamily: boolean;
    belongsToHouseId?: string; // Which house do they inherit from?
    belongsToHouseName?: string; // e.g. "House of Wanjiku"
    isHouseHead: boolean; // Are they the Matriarch of a house?
  };

  // 7. Legal & Succession Indicators (The "Digital Lawyer" Analysis)
  legalStatus: {
    isMinor: boolean; // < 18
    isAdult: boolean; // >= 18
    hasGuardian: boolean; // Integration point with Guardianship Module
    guardianId?: string;

    // S.29 Dependency Indicators
    qualifiesForS29: boolean; // "Yes" if Minor, Disabled, or Dependent
    disabilityStatus?: {
      hasDisability: boolean;
      description?: string;
    };

    // S.35/S.40 Rights
    inheritanceEligibility: 'FULL' | 'LIMITED' | 'NONE' | 'PENDING_VERIFICATION';
  };

  // 8. Contact & Meta
  metadata: {
    dateAdded: Date;
    lastUpdated: Date;
    addedBy: string;
  };
}
