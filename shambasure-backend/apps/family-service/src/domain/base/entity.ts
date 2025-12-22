// domain/base/entity.ts
import { DomainEvent } from './domain-event';
import { UniqueEntityID } from './unique-entity-id';

/**
 * Base Entity with Kenyan Legal Compliance Features
 *
 * Features:
 * - Immutable identity (court records must have stable IDs)
 * - Event sourcing support (audit trail for legal disputes)
 * - Deep freezing of props (prevent tampering with legal data)
 * - Timestamp tracking (required for statute of limitations)
 */
export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  protected readonly _props: T;
  private _domainEvents: DomainEvent[] = [];

  // Kenyan Legal Compliance: Audit Trail
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date; // Soft delete for legal retention

  // Event Sourcing: Version control for optimistic locking
  protected _version: number = 1;

  constructor(id: UniqueEntityID, props: T, createdAt?: Date) {
    this._id = id;
    this._props = Object.freeze({ ...props }); // Immutable props
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = this._createdAt;
  }

  get id(): UniqueEntityID {
    return this._id;
  }

  get props(): Readonly<T> {
    return this._props;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get version(): number {
    return this._version;
  }

  get isDeleted(): boolean {
    return !!this._deletedAt;
  }

  /**
   * Add domain event with timestamp for legal audit trail
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this._updatedAt = new Date();
  }

  /**
   * Get all uncommitted domain events (for event store)
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Clear events after persistence (called by repository)
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Increment version for optimistic locking
   * Critical for concurrent updates in court proceedings
   */
  protected incrementVersion(): void {
    this._version++;
    this._updatedAt = new Date();
  }

  /**
   * Soft delete (legal retention requirement - can't hard delete court records)
   */
  protected markAsDeleted(): void {
    if (this._deletedAt) {
      throw new Error('Entity already deleted');
    }
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  /**
   * Identity comparison (critical for legal entity matching)
   */
  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id.equals(object._id);
  }

  /**
   * Hash code for collections (use UUID value)
   */
  public hashCode(): string {
    return this._id.toString();
  }

  /**
   * Check if entity can be modified (not deleted, not in archived state)
   */
  protected ensureNotDeleted(): void {
    if (this.isDeleted) {
      throw new Error(
        `Cannot modify deleted entity [${this.constructor.name}:${this._id.toString()}]`,
      );
    }
  }

  /**
   * Deep clone props for mutation (returns new object, doesn't modify original)
   */
  protected cloneProps(): T {
    return JSON.parse(JSON.stringify(this._props));
  }
}
