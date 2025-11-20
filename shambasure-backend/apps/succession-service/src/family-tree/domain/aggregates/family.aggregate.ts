import { AggregateRoot } from '@nestjs/cqrs';
import { Family } from '../entities/family.entity';

export class FamilyAggregate extends AggregateRoot {
  private family: Family;

  private constructor(family: Family) {
    super();
    this.family = family;
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static create(id: string, ownerId: string, name: string, description?: string): FamilyAggregate {
    const family = Family.create(id, ownerId, name, description);
    return new FamilyAggregate(family);
  }

  static reconstitute(family: Family): FamilyAggregate {
    return new FamilyAggregate(family);
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateDetails(name: string, description?: string): void {
    this.family.updateMetadata(name, description);
  }

  archive(archivedBy: string): void {
    this.family.archive(archivedBy);
  }

  restore(): void {
    this.family.restore();
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getFamily(): Family {
    return this.family;
  }

  getId(): string {
    return this.family.getId();
  }
}
