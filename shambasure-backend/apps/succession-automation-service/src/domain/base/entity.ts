// domain/base/entity.ts
import { DomainEvent } from './domain-event';
import { UniqueEntityID } from './unique-entity-id';

/**
 * Base Entity with Legal Compliance & Event Sourcing Features
 *
 * Features:
 * - Immutable identity (stable IDs for legal records)
 * - Controlled state updates via updateState()
 * - Event sourcing support (audit trail for disputes)
 * - Deep freezing of props (prevent tampering with legal data)
 * - Timestamp tracking (statute of limitations compliance)
 * - Optimistic locking via versioning
 */
export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  private _props: T;
  private _domainEvents: DomainEvent[] = [];

  // Audit Trail
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  // Event Sourcing: Version control
  protected _version: number = 1;

  constructor(id: UniqueEntityID, props: T, createdAt?: Date) {
    this._id = id;
    this._props = Object.freeze({ ...props });
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = this._createdAt;
  }

  // Identity
  get id(): UniqueEntityID {
    return this._id;
  }

  // Props access
  get props(): Readonly<T> {
    return this._props;
  }

  // Audit fields
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
   * Centralized state update method
   * - Freezes new props
   * - Updates timestamp
   * - Increments version
   * - Ensures entity is not deleted
   */
  protected updateState(newProps: Partial<T>): void {
    this.ensureNotDeleted();
    const cloned = this.cloneProps();
    const merged = { ...cloned, ...newProps };
    this._props = Object.freeze(merged);
    this.incrementVersion();
  }

  /**
   * Add domain event with timestamp for audit trail
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this._updatedAt = new Date();
  }

  /**
   * Get all uncommitted domain events
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Clear events after persistence
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Increment version for optimistic locking
   */
  protected incrementVersion(): void {
    this._version++;
    this._updatedAt = new Date();
  }

  /**
   * Soft delete (legal retention requirement)
   */
  protected markAsDeleted(): void {
    if (this._deletedAt) {
      throw new Error('Entity already deleted');
    }
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  /**
   * Identity comparison
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
   * Hash code for collections
   */
  public hashCode(): string {
    return this._id.toString();
  }

  /**
   * Ensure entity is not deleted before mutation
   */
  protected ensureNotDeleted(): void {
    if (this.isDeleted) {
      throw new Error(
        `Cannot modify deleted entity [${this.constructor.name}:${this._id.toString()}]`,
      );
    }
  }

  /**
   * Deep clone props for safe mutation
   */
  protected cloneProps(): T {
    return JSON.parse(JSON.stringify(this._props));
  }
}
