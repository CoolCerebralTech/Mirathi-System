// domain/base/aggregate-root.ts
import { DomainEvent } from './domain-event';
import { Entity } from './entity';
import { UniqueEntityID } from './unique-entity-id';

/**
 * Aggregate Root for Kenyan Legal System
 *
 * Enforces:
 * - Transactional boundaries (one aggregate = one database transaction)
 * - Event sourcing (all state changes emit events for audit)
 * - Invariant validation (business rules must hold within aggregate)
 * - Optimistic concurrency control (critical for court system)
 *
 * Legal Compliance:
 * - Every state change is recorded as event (S. 83 LSA - executor duties)
 * - Version tracking prevents race conditions in court filings
 * - Soft delete maintains legal audit trail
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _uncommittedEvents: DomainEvent[] = [];

  // Event Sourcing: Track last persisted event for rebuild
  protected _lastEventId?: string;

  constructor(id: UniqueEntityID, props: T, createdAt?: Date) {
    super(id, props, createdAt);
  }

  get lastEventId(): string | undefined {
    return this._lastEventId;
  }

  /**
   * Add domain event with automatic versioning
   * Critical: Every aggregate state change MUST emit event for legal audit
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
    this._lastEventId = event.eventId;
    this.incrementVersion(); // Optimistic lock
    this._updatedAt = new Date();
  }

  /**
   * Get all uncommitted events for persistence
   * Repository will persist these to event store
   */
  public getUncommittedEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._uncommittedEvents]);
  }

  /**
   * Clear events after successful persistence
   * Called by repository after transaction commit
   */
  public clearEvents(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Get current aggregate version (for optimistic locking)
   * When persisting, check: WHERE version = expectedVersion
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * Optimistic Concurrency Control
   * Throws if version mismatch (another process modified aggregate)
   */
  public checkVersion(expectedVersion: number): void {
    if (this._version !== expectedVersion) {
      throw new ConcurrencyError(
        `Version mismatch for ${this.constructor.name}[${this.id.toString()}]. ` +
          `Expected: ${expectedVersion}, Current: ${this._version}`,
      );
    }
  }

  /**
   * Replay events to rebuild aggregate state (event sourcing)
   * Used for:
   * 1. Legal audit - reconstruct state at any point in time
   * 2. Testing - verify business logic
   * 3. Temporal queries - "What was family structure on date of death?"
   */
  public static replayEvents<T extends AggregateRoot<any>>(aggregate: T, events: DomainEvent[]): T {
    events.forEach((event) => {
      aggregate.applyEvent(event);
    });
    return aggregate;
  }

  /**
   * Apply event to aggregate state (for event sourcing)
   * Override in concrete aggregates
   */
  protected abstract applyEvent(event: DomainEvent): void;

  /**
   * Validate aggregate invariants before persistence
   * Must be called before saving to ensure legal compliance
   *
   * Examples:
   * - Family: Must have at least one member
   * - Marriage: Both spouses must be of legal age
   * - Guardianship: Ward must be minor or incapacitated
   */
  public abstract validate(): void;

  /**
   * Snapshot aggregate state for event store optimization
   * Reduces event replay time for aggregates with many events
   */
  public createSnapshot(): AggregateSnapshot {
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
   * Restore from snapshot (optimization for event sourcing)
   */
  public static fromSnapshot<T extends AggregateRoot<any>>(
    snapshot: AggregateSnapshot,
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
   * Get aggregate type for event store
   */
  public getAggregateType(): string {
    return this.constructor.name;
  }
}

/**
 * Aggregate Snapshot for Event Store
 */
export interface AggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
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
