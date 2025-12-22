// domain/value-objects/dependency/dependency-assessment.vo.ts
import { DependencyLevel } from '@prisma/client';

import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

/**
 * Dependency Assessment Value Object
 *
 * Represents the calculated dependency level and percentage
 */
interface DependencyAssessmentProps {
  dependencyLevel: DependencyLevel;
  dependencyPercentage: number; // 0-100
  assessmentMethod: string; // How dependency was calculated
  assessmentDate: Date;
  monthlySupport?: number; // Evidence amount
  dependencyRatio?: number; // support / deceased income
}

export class DependencyAssessment extends ValueObject<DependencyAssessmentProps> {
  private constructor(props: DependencyAssessmentProps) {
    super(props);
  }

  public static create(props: DependencyAssessmentProps): DependencyAssessment {
    return new DependencyAssessment(props);
  }

  protected validate(): void {
    if (this.props.dependencyPercentage < 0 || this.props.dependencyPercentage > 100) {
      throw new ValueObjectValidationError(
        'Dependency percentage must be between 0 and 100',
        'dependencyPercentage',
      );
    }

    if (!this.props.assessmentMethod || this.props.assessmentMethod.trim().length === 0) {
      throw new ValueObjectValidationError('Assessment method is required', 'assessmentMethod');
    }

    if (this.props.assessmentDate > new Date()) {
      throw new ValueObjectValidationError(
        'Assessment date cannot be in the future',
        'assessmentDate',
      );
    }
  }

  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }

  get dependencyPercentage(): number {
    return this.props.dependencyPercentage;
  }

  get assessmentMethod(): string {
    return this.props.assessmentMethod;
  }

  get assessmentDate(): Date {
    return this.props.assessmentDate;
  }

  /**
   * Update assessment with new evidence
   */
  public updateAssessment(params: {
    dependencyPercentage?: number;
    assessmentMethod?: string;
    monthlySupport?: number;
    dependencyRatio?: number;
  }): DependencyAssessment {
    const newPercentage = params.dependencyPercentage ?? this.props.dependencyPercentage;

    // Recalculate dependency level
    let newLevel: DependencyLevel;
    if (newPercentage >= 75) {
      newLevel = DependencyLevel.FULL;
    } else if (newPercentage >= 25) {
      newLevel = DependencyLevel.PARTIAL;
    } else {
      newLevel = DependencyLevel.NONE;
    }

    return DependencyAssessment.create({
      dependencyLevel: newLevel,
      dependencyPercentage: newPercentage,
      assessmentMethod: params.assessmentMethod ?? this.props.assessmentMethod,
      assessmentDate: new Date(),
      monthlySupport: params.monthlySupport ?? this.props.monthlySupport,
      dependencyRatio: params.dependencyRatio ?? this.props.dependencyRatio,
    });
  }

  public toJSON(): Record<string, any> {
    return {
      dependencyLevel: this.props.dependencyLevel,
      dependencyPercentage: this.props.dependencyPercentage,
      assessmentMethod: this.props.assessmentMethod,
      assessmentDate: this.props.assessmentDate.toISOString(),
      monthlySupport: this.props.monthlySupport,
      dependencyRatio: this.props.dependencyRatio,
    };
  }
}
