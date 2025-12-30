import {
  BequestPriority,
  BequestType,
} from '../../../../domain/entities/beneficiary-assignment.entity';

/**
 * Data Transfer Object for adding a beneficiary/bequest.
 *
 * POLYMORPHISM:
 * Depending on 'bequestType', different optional fields (percentage, fixedAmount, specificAssetId)
 * become mandatory. This validation happens in the Domain Entity, but the DTO carries the payload.
 */
export interface AddBeneficiaryDto {
  // --- WHO (The Beneficiary) ---
  beneficiary: {
    type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
    userId?: string; // If type = USER
    familyMemberId?: string; // If type = FAMILY_MEMBER
    externalDetails?: {
      // If type = EXTERNAL
      name: string;
      nationalId?: string;
      kraPin?: string;
      relationship?: string;
    };
  };

  // --- WHAT (The Gift) ---
  bequestType: BequestType;

  // Value Specifications (Mutually exclusive based on type)
  specificAssetId?: string; // For SPECIFIC_ASSET
  percentage?: number; // For PERCENTAGE (0-100)
  fixedAmount?: number; // For FIXED_AMOUNT (assumes KES by default)
  residuaryShare?: number; // For RESIDUARY

  description: string; // Human readable: "My gold watch"
  priority?: BequestPriority; // Default: PRIMARY

  // --- CONDITIONS (Optional) ---
  conditions?: {
    type: 'AGE_REQUIREMENT' | 'SURVIVAL' | 'EDUCATION' | 'MARRIAGE' | 'NONE';
    parameter?: any; // e.g., age: 21, or survivalDays: 30
  }[];
}
