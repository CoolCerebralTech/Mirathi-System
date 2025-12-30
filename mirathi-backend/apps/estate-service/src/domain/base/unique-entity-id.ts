// domain/base/unique-entity-id.ts
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid';

/**
 * UniqueEntityID Value Object
 *
 * Ensures:
 * - All entities have valid UUIDs (matches Prisma @db.Uuid())
 * - Immutable identity (legal requirement)
 * - Type safety (can't mix entity IDs)
 *
 * Kenyan Legal Context:
 * - Court case numbers, grant numbers are UUIDs in our system
 * - Prevents accidental ID mixing in relationships
 */
export class UniqueEntityID {
  private readonly value: string;

  constructor(id?: string) {
    this.value = id ?? uuidv4();

    if (!uuidValidate(this.value)) {
      throw new Error(`Invalid UUID: ${this.value}`);
    }
  }

  /**
   * Get raw UUID string
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Get raw value (alias for toString)
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Compare identity
   */
  public equals(id?: UniqueEntityID): boolean {
    if (id === null || id === undefined) {
      return false;
    }

    if (!(id instanceof UniqueEntityID)) {
      return false;
    }

    return this.value === id.value;
  }

  /**
   * Create from string (validation)
   */
  public static create(id?: string): UniqueEntityID {
    return new UniqueEntityID(id);
  }

  /**
   * Check if string is valid UUID
   */
  public static isValid(id: string): boolean {
    return uuidValidate(id);
  }
}
