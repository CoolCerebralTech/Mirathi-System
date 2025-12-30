// domain/base/aggregate-root.ts
import { DomainEvent } from './domain-event';
import { Entity } from './entity';
import { UniqueEntityID } from './unique-entity-id';

/**
 * Aggregate Root for Kenyan Legal System
 *
 * Responsibilities:
 * - Defines transactional boundary (aggregate = one transaction)
 * - Emits domain events for every state change (audit trail)
 * - Validates invariants before persistence
 * - Provides optimistic concurrency control
 *
 * Legal Compliance:
 * - Every state change recorded as event (S. 83 LSA - executor duties)
 * - Version tracking prevents race conditions in filings
 * - Soft delete maintains audit trail
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _uncommittedEvents: DomainEvent[] = [];

  // Event Sourcing: Track last persisted event
  protected _lastEventId?: string;

  constructor(id: UniqueEntityID, props: T, createdAt?: Date) {
    super(id, props, createdAt);
  }

  get lastEventId(): string | undefined {
    return this._lastEventId;
  }

  /**
   * Add domain event with automatic versioning
   * Every aggregate state change MUST emit event for audit
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.ensureNotDeleted();
    this._uncommittedEvents.push(event);
    this._lastEventId = event.eventId;
    this.incrementVersion(); // Optimistic lock
    this._updatedAt = new Date();
  }

  /**
   * Get all uncommitted events for persistence
   */
  public getUncommittedEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._uncommittedEvents]);
  }

  /**
   * Clear events after successful persistence
   */
  public clearEvents(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Current aggregate version (for optimistic locking)
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * Optimistic Concurrency Control
   */
  public checkVersion(expectedVersion: number): void {
    if (this._version !== expectedVersion) {
      throw new ConcurrencyError(
        `Version mismatch in ${this.constructor.name}[${this.id.toString()}]. ` +
          `Expected: ${expectedVersion}, Actual: ${this._version}`,
      );
    }
  }

  /**
   * Replay events to rebuild aggregate state
   */
  public static replayEvents<T extends AggregateRoot<any>>(aggregate: T, events: DomainEvent[]): T {
    events.forEach((event) => {
      aggregate.applyEvent(event);
      aggregate.incrementVersion();
    });
    return aggregate;
  }

  /**
   * Apply event to aggregate state (must be overridden)
   */
  protected abstract applyEvent(event: DomainEvent): void;

  /**
   * Validate aggregate invariants before persistence
   */
  public abstract validate(): void;

  /**
   * Snapshot aggregate state for event store optimization
   */
  public createSnapshot(): AggregateSnapshot<T> {
    return {
      aggregateId: this.id.toString(),
      aggregateType: this.constructor.name,
      version: this._version,
      state: this.cloneProps(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      lastEventId: this._lastEventId,
    };
  }

  /**
   * Restore from snapshot
   */
  public static fromSnapshot<T extends AggregateRoot<any>>(
    snapshot: AggregateSnapshot<any>,
    factory: (id: UniqueEntityID, props: any) => T,
  ): T {
    const aggregate = factory(new UniqueEntityID(snapshot.aggregateId), snapshot.state);

    // Restore version and timestamps
    (aggregate as any)._version = snapshot.version;
    (aggregate as any)._updatedAt = snapshot.updatedAt;
    (aggregate as any)._deletedAt = snapshot.deletedAt;
    (aggregate as any)._lastEventId = snapshot.lastEventId;

    return aggregate;
  }

  /**
   * Aggregate type for event store
   */
  public getAggregateType(): string {
    return this.constructor.name;
  }
}

/**
 * Aggregate Snapshot for Event Store
 */
export interface AggregateSnapshot<T = any> {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: T;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  lastEventId?: string;
}

/**
 * Concurrency Error for Optimistic Locking
 */
export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}
