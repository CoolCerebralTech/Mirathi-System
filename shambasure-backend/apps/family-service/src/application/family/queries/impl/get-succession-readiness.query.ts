import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to run the Legal Analysis Engine.
 *
 * Investor Note / USP:
 * This triggers the domain logic that checks:
 * - Section 29 Compliance (Are dependents documented?)
 * - Section 40 Readiness (Are Polygamous Houses defined?)
 * - Data Integrity (Are IDs verified?)
 */
export class GetSuccessionReadinessQuery extends BaseQuery {
  public readonly familyId: string;

  constructor(props: { userId: string; familyId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
  }
}
