// domain/base/entity.ts
import { DomainEvent } from './domain-event';

export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly _props: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(id: string, props: T) {
    this._id = id;
    this._props = props;
  }

  get id(): string {
    return this._id;
  }

  get props(): T {
    return this._props;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

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

    return this._id === object._id;
  }
}
