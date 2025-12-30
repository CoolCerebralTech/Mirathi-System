// src/estate-service/src/domain/value-objects/executor-priority.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export type ExecutorPriorityType = 'PRIMARY' | 'SUBSTITUTE' | 'CO_EXECUTOR';

export interface ExecutorPriorityProps {
  priority: ExecutorPriorityType;
  order?: number; // For co-executors: 1, 2, 3...
  isChain: boolean; // Whether this is part of a chain of substitution
}

/**
 * Executor Priority Value Object
 *
 * Represents the priority and role of an executor in Kenyan succession
 * Legal Requirements (S.83 LSA):
 * - Testator may appoint multiple executors
 * - Executors act jointly unless otherwise specified
 * - Substitution is allowed if primary cannot act
 * - Chain of substitution must be clear
 */
export class ExecutorPriority extends ValueObject<ExecutorPriorityProps> {
  constructor(props: ExecutorPriorityProps) {
    super(props);
  }
  public get level(): string {
    return this.props.priority;
  }

  public get order(): number {
    return this.props.order || 1;
  }

  protected validate(): void {
    // Validate priority type
    const validPriorities: ExecutorPriorityType[] = ['PRIMARY', 'SUBSTITUTE', 'CO_EXECUTOR'];
    if (!validPriorities.includes(this.props.priority)) {
      throw new ValueObjectValidationError(
        `Invalid executor priority: ${this.props.priority}`,
        'priority',
      );
    }

    // Validate order for co-executors
    if (this.props.priority === 'CO_EXECUTOR') {
      if (!this.props.order || this.props.order < 1) {
        throw new ValueObjectValidationError(
          'Co-executor must have a positive order number',
          'order',
        );
      }
    }

    // Validate chain logic
    if (this.props.isChain && this.props.priority !== 'SUBSTITUTE') {
      throw new ValueObjectValidationError(
        'Only substitute executors can be part of a chain',
        'isChain',
      );
    }
  }

  /**
   * Check if this executor takes precedence over another
   */
  public takesPrecedenceOver(other: ExecutorPriority): boolean {
    if (this.props.priority === 'PRIMARY') {
      return other.props.priority !== 'PRIMARY';
    }

    if (this.props.priority === 'CO_EXECUTOR') {
      if (other.props.priority === 'PRIMARY') return false;
      if (other.props.priority === 'SUBSTITUTE') return true;
      // Both are co-executors, compare order
      return (this.props.order || 0) < (other.props.order || 0);
    }

    // This is SUBSTITUTE
    if (other.props.priority === 'SUBSTITUTE') {
      // Both are substitutes, chain takes precedence
      return this.props.isChain && !other.props.isChain;
    }

    return false; // SUBSTITUTE has lowest precedence
  }

  /**
   * Get display label
   */
  public getLabel(): string {
    switch (this.props.priority) {
      case 'PRIMARY':
        return 'Primary Executor';
      case 'SUBSTITUTE':
        return this.props.isChain ? 'Chain Substitute Executor' : 'Substitute Executor';
      case 'CO_EXECUTOR':
        return `Co-Executor #${this.props.order}`;
      default:
        return 'Executor';
    }
  }

  /**
   * Check if this executor can act alone
   */
  public canActAlone(): boolean {
    return (
      this.props.priority === 'PRIMARY' ||
      (this.props.priority === 'SUBSTITUTE' && !this.props.isChain)
    );
  }
  /**
   * [NEW] Factory for Mapper to reconstitute from DB columns
   */
  public static create(priorityLevel: string, priorityOrder: number): ExecutorPriority {
    // Map raw DB string to Domain Enum safely
    let priority: ExecutorPriorityType;
    let isChain = false;

    // Normalize input
    const level = priorityLevel.toUpperCase();

    if (level === 'PRIMARY') {
      priority = 'PRIMARY';
    } else if (level === 'SUBSTITUTE') {
      priority = 'SUBSTITUTE';
      // Logic: If order > 1 for a substitute, implies a chain/ranking
      isChain = priorityOrder > 1;
    } else if (level === 'CO_EXECUTOR' || level === 'JOINT') {
      priority = 'CO_EXECUTOR';
    } else {
      // Fallback or Error
      priority = 'PRIMARY';
    }

    return new ExecutorPriority({
      priority,
      order: priorityOrder,
      isChain,
    });
  }

  public toJSON(): Record<string, any> {
    return {
      priority: this.props.priority,
      order: this.props.order,
      isChain: this.props.isChain,
    };
  }

  // Static factory methods
  public static primary(): ExecutorPriority {
    return new ExecutorPriority({
      priority: 'PRIMARY',
      isChain: false,
    });
  }

  public static substitute(isChain: boolean = false): ExecutorPriority {
    return new ExecutorPriority({
      priority: 'SUBSTITUTE',
      isChain,
    });
  }

  public static coExecutor(order: number): ExecutorPriority {
    return new ExecutorPriority({
      priority: 'CO_EXECUTOR',
      order,
      isChain: false,
    });
  }
}
