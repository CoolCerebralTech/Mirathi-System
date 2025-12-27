/**
 * DTO for running the Compliance Radar on a specific Will.
 *
 * USE CASE:
 * Before execution (or during probate), we run this to generate
 * a list of Warnings (S.26 risks) and Violations (S.11 failures).
 */
export interface GetComplianceReportDto {
  willId: string;

  /**
   * Scope of the report.
   * 'FULL' includes external family checks (via Family Service).
   * 'INTERNAL' checks only data within the Will Aggregate.
   */
  scope: 'INTERNAL' | 'FULL';
}
