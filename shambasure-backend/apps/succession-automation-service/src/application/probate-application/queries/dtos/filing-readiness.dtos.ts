import { IsUUID } from 'class-validator';

// ==============================================================================
// 1. Validate Filing Readiness (Pre-flight Check)
// ==============================================================================
export class ValidateFilingReadinessDto {
  @IsUUID()
  applicationId: string;
}

// ==============================================================================
// 2. Calculate Filing Fees (Dynamic Quote)
// ==============================================================================
export class CalculateFilingFeesDto {
  @IsUUID()
  applicationId: string;
}

// ==============================================================================
// 3. Get Court Requirements (For selected court)
// ==============================================================================
export class GetCourtRequirementsDto {
  @IsUUID()
  applicationId: string;
}
