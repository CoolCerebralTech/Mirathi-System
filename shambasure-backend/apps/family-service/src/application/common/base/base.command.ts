import { v4 as uuidv4 } from 'uuid';

/**
 * BaseCommand
 * A foundational abstraction for CQRS commands in a DDD system.
 * Provides traceability, immutability, and context propagation.
 */
export abstract class BaseCommand {
  /** Unique identifier for this command instance */
  public readonly commandId: string;

  /** Timestamp when the command was created */
  public readonly timestamp: Date;

  /** User context (who triggered the command) */
  public readonly userId: string;

  /** Correlation ID for tracing across systems */
  public readonly correlationId: string;

  /** Optional causation ID (which event/command caused this one) */
  public readonly causationId?: string;

  protected constructor(props: { userId: string; correlationId?: string; causationId?: string }) {
    this.commandId = uuidv4();
    this.timestamp = new Date();

    this.userId = props.userId;
    this.correlationId = props.correlationId ?? uuidv4();
    this.causationId = props.causationId;
  }

  /**
   * Validate command invariants.
   * Override in concrete commands to enforce domain rules.
   */
  public validate(): void {
    if (!this.userId) {
      throw new Error('BaseCommand requires a valid userId.');
    }
  }

  /**
   * Serialize to plain object for logging, persistence, or messaging.
   */
  public toJSON(): Record<string, unknown> {
    return {
      commandId: this.commandId,
      timestamp: this.timestamp.toISOString(),
      userId: this.userId,
      correlationId: this.correlationId,
      causationId: this.causationId,
      type: this.constructor.name,
    };
  }
}
