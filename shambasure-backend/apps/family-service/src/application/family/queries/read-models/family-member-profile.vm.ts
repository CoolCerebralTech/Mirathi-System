import { Gender } from '../../../../domain/value-objects/family-enums.vo';

/**
 * Detailed 360-degree Profile View for a single family member.
 *
 * Investor Note:
 * This view consolidates data from multiple sources (Identity, Kinship Graph, Legal Status)
 * into one payload, reducing frontend API chatter.
 */
export interface FamilyMemberProfileVM {
  id: string;

  // Core Identity
  fullName: string;
  officialName: string; // Format: "SURNAME, First Name Middle" (for legal docs)
  gender: Gender;
  dateOfBirth?: Date;
  age?: number;

  // Life Status
  isAlive: boolean;
  deathDate?: Date;

  // Cultural Context
  tribe?: string;
  clan?: string; // Fallback to Family Clan if personal clan not set

  // Identity Verification (KYC)
  nationalId?: string;
  isVerified: boolean;
  verificationMethod?: string; // e.g. "IPRS_CHECK", "MANUAL_UPLOAD"

  // Immediate Kinship (Navigation Links)
  // These allow the frontend to click through the family tree
  parents: Array<{ id: string; name: string }>;

  spouses: Array<{
    id: string;
    name: string;
    status: string; // "MARRIED", "DIVORCED", "WIDOWED"
  }>;

  children: Array<{ id: string; name: string }>;

  siblings: Array<{ id: string; name: string }>;

  // Legal & Succession Indicators
  legalStatus: {
    isMinor: boolean;
    hasGuardian: boolean; // Integration point with Guardianship Module
    qualifiesForS29: boolean; // "Yes" if Minor, Disabled, or Dependent
  };
}
