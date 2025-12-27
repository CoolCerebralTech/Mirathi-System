import { ExecutorPriorityType } from '../../../../domain/value-objects/executor-priority.vo';

/**
 * Data Transfer Object for Appointing an Executor.
 *
 * LEGAL CONTEXT (S.83 LSA):
 * - Executors are the legal representatives.
 * - Can be "Testamentary" (named in will).
 * - Minors can be named but cannot act until 18.
 */
export interface AppointExecutorDto {
  // --- WHO (The Nominee) ---
  executorIdentity: {
    type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
    userId?: string;
    familyMemberId?: string;
    externalDetails?: {
      fullName: string;
      nationalId?: string;
      kraPin?: string;
      email?: string;
      phone?: string;
      relationship?: string;
    };
  };

  // --- AUTHORITY LEVEL ---
  priority: ExecutorPriorityType; // PRIMARY, SUBSTITUTE, CO_EXECUTOR

  /**
   * Required if priority is CO_EXECUTOR (e.g., 1, 2)
   */
  order?: number;

  /**
   * Specific powers granted (optional).
   * e.g., "Power to sell land", "Power to run business"
   */
  powers?: string[];

  /**
   * Compensation details (optional).
   * Usually executors are unpaid, but can be given a legacy.
   */
  compensation?: {
    isEntitled: boolean;
    amount?: number;
    basis?: 'FIXED' | 'PERCENTAGE' | 'REASONABLE';
  };
}
