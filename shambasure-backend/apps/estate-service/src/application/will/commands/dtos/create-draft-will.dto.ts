import { WillType } from '../../../../domain/enums/will-type.enum';

/**
 * Data Transfer Object for creating a new Will Draft.
 *
 * Defines the pure data structure required by the Application Layer.
 * Decoupled from HTTP/JSON specifics.
 */
export interface CreateDraftWillDto {
  /**
   * The type of Will to create (e.g., STANDARD, ISLAMIC).
   * Defaults to STANDARD if not provided.
   */
  type?: WillType;

  /**
   * Optional initial capacity declaration if available at creation time.
   * (e.g., Medical certificate upload immediately upon drafting).
   */
  initialCapacityDeclaration?: {
    status: string;
    date: Date;
    assessedBy?: string;
    notes?: string;
    documentIds: string[];
  };
}
