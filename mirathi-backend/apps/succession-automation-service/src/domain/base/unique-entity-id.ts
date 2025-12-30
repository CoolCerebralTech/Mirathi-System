// domain/base/unique-entity-id.ts
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid';

/**
 * UniqueEntityID Value Object
 *
 * Guarantees:
 * - Valid UUIDs only (matches Prisma @db.Uuid())
 * - Immutable identity (legal requirement)
 * - Type safety (prevents accidental ID mixing)
 *
 * Kenyan Legal Context:
 * - Court case numbers, grant numbers are UUIDs in our system
 * - Prevents accidental ID mixing in relationships
 */
export class UniqueEntityID {
  private readonly value: string;

  constructor(id?: string) {
    const candidate = id ?? uuidv4();

    if (!uuidValidate(candidate)) {
      throw new Error(`Invalid UUID: ${candidate}`);
    }

    this.value = candidate;

    // Freeze the instance to enforce immutability
    Object.freeze(this);
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
   * Compare identity with another UniqueEntityID or raw string
   */
  public equals(other?: UniqueEntityID | string): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (typeof other === 'string') {
      return this.value === other;
    }

    if (!(other instanceof UniqueEntityID)) {
      return false;
    }

    return this.value === other.value;
  }

  /**
   * Serialize for persistence (e.g., Prisma, JSON APIs)
   */
  public toJSON(): string {
    return this.value;
  }

  /**
   * Factory: Create new UniqueEntityID (random UUID if none provided)
   */
  public static create(id?: string): UniqueEntityID {
    return new UniqueEntityID(id);
  }

  /**
   * Factory: Explicitly create from string (validation enforced)
   */
  public static fromString(id: string): UniqueEntityID {
    if (!uuidValidate(id)) {
      throw new Error(`Invalid UUID string: ${id}`);
    }
    return new UniqueEntityID(id);
  }

  /**
   * Factory: Generate a brand new UUID
   */
  public static newID(): UniqueEntityID {
    return new UniqueEntityID(uuidv4());
  }

  /**
   * Check if string is valid UUID
   */
  public static isValid(id: string): boolean {
    return uuidValidate(id);
  }
}
