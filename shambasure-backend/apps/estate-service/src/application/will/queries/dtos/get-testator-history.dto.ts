/**
 * DTO for retrieving the full audit trail of a Testator's wills.
 *
 * USE CASE:
 * Probate disputes often require proving the "Chain of Intent".
 * This query returns all versions: Drafts -> Active -> Revoked.
 */
export interface GetTestatorHistoryDto {
  testatorId: string;
}
