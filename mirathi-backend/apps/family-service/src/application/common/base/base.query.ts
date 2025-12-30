import { v4 as uuidv4 } from 'uuid';

import { IQuery } from '../interfaces/use-case.interface';

/**
 * BaseQuery
 * Foundation for CQRS queries in a DDD system.
 * Provides traceability, immutability, and context propagation.
 */
export abstract class BaseQuery implements IQuery {
  /** Unique identifier for this query instance */
  public readonly queryId: string;

  /** Timestamp when the query was created */
  public readonly timestamp: Date;

  /** User context (who triggered the query) */
  public readonly userId: string;

  /** Correlation ID for tracing across systems */
  public readonly correlationId: string;

  protected constructor(props: { userId: string; correlationId?: string }) {
    this.queryId = uuidv4();
    this.timestamp = new Date();

    this.userId = props.userId;
    this.correlationId = props.correlationId ?? uuidv4();
  }

  /**
   * Serialize to plain object for logging or transport.
   */
  public toJSON(): Record<string, unknown> {
    return {
      queryId: this.queryId,
      timestamp: this.timestamp.toISOString(),
      userId: this.userId,
      correlationId: this.correlationId,
      type: this.constructor.name,
    };
  }
}
