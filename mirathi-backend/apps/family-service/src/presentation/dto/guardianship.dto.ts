// apps/family-service/src/presentation/dto/guardianship.dto.ts
import { Type } from 'class-transformer';
import { IsBoolean, IsUUID, ValidateNested } from 'class-validator';

// ============================================================================
// GUARDIANSHIP DTOs
// ============================================================================

export class GuardianEligibilityChecklistDto {
  // Basic Requirements
  @IsBoolean()
  isOver18: boolean;

  @IsBoolean()
  hasNoCriminalRecord: boolean;

  @IsBoolean()
  isMentallyCapable: boolean;

  // Financial & Stability
  @IsBoolean()
  hasFinancialStability: boolean;

  @IsBoolean()
  hasStableResidence: boolean;

  // Character & Suitability
  @IsBoolean()
  hasGoodMoralCharacter: boolean;

  @IsBoolean()
  isNotBeneficiary: boolean;

  @IsBoolean()
  hasNoSubstanceAbuse: boolean;

  // Practical
  @IsBoolean()
  isPhysicallyCapable: boolean;

  @IsBoolean()
  hasTimeAvailability: boolean;

  // Relationship
  @IsBoolean()
  hasCloseRelationship: boolean;

  @IsBoolean()
  hasWardConsent: boolean;

  // Legal
  @IsBoolean()
  understandsLegalDuties: boolean;

  @IsBoolean()
  willingToPostBond: boolean;
}

export class CheckGuardianEligibilityDto {
  @IsUUID()
  guardianId: string;

  @IsUUID()
  wardId: string;

  @ValidateNested()
  @Type(() => GuardianEligibilityChecklistDto)
  checklist: GuardianEligibilityChecklistDto;
}

export class AssignGuardianDto {
  @IsUUID()
  wardId: string;

  @IsUUID()
  guardianId: string;

  @IsBoolean()
  isPrimary: boolean;

  @ValidateNested()
  @Type(() => GuardianEligibilityChecklistDto)
  checklist: GuardianEligibilityChecklistDto;
}
