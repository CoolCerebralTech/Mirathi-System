/**
 * DTO for finding the currently effective Will for a Testator.
 *
 * LEGAL CONTEXT:
 * Only one Will can be "Active" at a time. This query resolves
 * the latest valid intention of the testator.
 */
export interface GetActiveWillDto {
  testatorId: string;
}
