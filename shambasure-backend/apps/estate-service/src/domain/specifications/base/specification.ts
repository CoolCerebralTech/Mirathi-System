// domain/specifications/base/specification.ts

/**
 * Specification Pattern (DDD)
 *
 * Purpose:
 * - Encapsulate business rules as objects
 * - Make complex queries readable and testable
 * - Enable composition (AND, OR, NOT)
 * - Reusable across use cases
 *
 * Benefits:
 * - Business logic in one place
 * - Easy to test in isolation
 * - Composable (combine specifications)
 * - Type-safe query building
 *
 * Kenyan Legal Context:
 * - Specifications encode LSA business rules
 * - Examples: "Is estate solvent?", "Has critical debts?"
 * - Reusable in repositories, domain services, validation
 *
 * Design Pattern: Specification Pattern (Eric Evans, DDD)
 */

/**
 * Base Specification Interface
 *
 * Generic over entity type T
 */
export interface ISpecification<T> {
  /**
   * Check if entity satisfies specification
   *
   * Used for:
   * - In-memory filtering
   * - Validation
   * - Business rule checks
   */
  isSatisfiedBy(entity: T): boolean;

  /**
   * Combine with another specification (AND)
   *
   * Example:
   * const spec = isSolvent.and(hasNoCriticalDebts);
   */
  and(other: ISpecification<T>): ISpecification<T>;

  /**
   * Combine with another specification (OR)
   *
   * Example:
   * const spec = isTestate.or(isIntestate);
   */
  or(other: ISpecification<T>): ISpecification<T>;

  /**
   * Negate specification (NOT)
   *
   * Example:
   * const spec = isFrozen.not();
   */
  not(): ISpecification<T>;
}

/**
 * Abstract Base Specification
 *
 * Implements composition logic (and, or, not)
 * Subclasses only need to implement isSatisfiedBy()
 */
export abstract class Specification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(entity: T): boolean;

  public and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification<T>(this, other);
  }

  public or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification<T>(this, other);
  }

  public not(): ISpecification<T> {
    return new NotSpecification<T>(this);
  }
}

/**
 * AND Specification
 *
 * Both specifications must be satisfied
 */
export class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }
}

/**
 * OR Specification
 *
 * At least one specification must be satisfied
 */
export class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }
}

/**
 * NOT Specification
 *
 * Specification must NOT be satisfied
 */
export class NotSpecification<T> extends Specification<T> {
  constructor(private readonly spec: ISpecification<T>) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return !this.spec.isSatisfiedBy(entity);
  }
}

/**
 * Always True Specification
 *
 * Useful as base case or for testing
 */
export class TrueSpecification<T> extends Specification<T> {
  public isSatisfiedBy(_entity: T): boolean {
    return true;
  }
}

/**
 * Always False Specification
 *
 * Useful as base case or for testing
 */
export class FalseSpecification<T> extends Specification<T> {
  public isSatisfiedBy(_entity: T): boolean {
    return false;
  }
}

/**
 * Composite Specification Builder
 *
 * Fluent interface for building complex specifications
 *
 * Example:
 * const spec = SpecificationBuilder
 *   .where(new IsSolventSpecification())
 *   .and(new HasNoCriticalDebtsSpecification())
 *   .and(new IsNotFrozenSpecification())
 *   .build();
 */
export class SpecificationBuilder<T> {
  private specification: ISpecification<T>;

  private constructor(initialSpec: ISpecification<T>) {
    this.specification = initialSpec;
  }

  public static where<T>(spec: ISpecification<T>): SpecificationBuilder<T> {
    return new SpecificationBuilder(spec);
  }

  public and(spec: ISpecification<T>): SpecificationBuilder<T> {
    this.specification = this.specification.and(spec);
    return this;
  }

  public or(spec: ISpecification<T>): SpecificationBuilder<T> {
    this.specification = this.specification.or(spec);
    return this;
  }

  public not(): SpecificationBuilder<T> {
    this.specification = this.specification.not();
    return this;
  }

  public build(): ISpecification<T> {
    return this.specification;
  }
}
