import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Get Estate Financials DTO
 *
 * Requests a computed snapshot of:
 * - Net Worth
 * - Liquidity Ratio
 * - S.45 Liability Coverage
 * - Solvency Status
 */
export class GetEstateFinancialsDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;
}
