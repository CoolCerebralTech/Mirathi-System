/**
 * DTO for finding wills where a specific user is named as Executor.
 *
 * USE CASE:
 * "Show me all the estates I am supposed to manage."
 */
export interface GetExecutorAssignmentsDto {
  /**
   * The email or User ID of the executor.
   */
  executorIdentifier: string;

  /**
   * Filter by status of the will (e.g., only ACTIVE wills).
   */
  willStatus?: string[];
}
