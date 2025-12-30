/**
 * DTO for retrieving a single Will by ID.
 */
export interface GetWillByIdDto {
  willId: string;

  /**
   * If true, returns the 'Deep' aggregate with all children (codicils, etc.).
   * If false, returns a summary.
   * Default: true
   */
  includeDetails?: boolean;
}
