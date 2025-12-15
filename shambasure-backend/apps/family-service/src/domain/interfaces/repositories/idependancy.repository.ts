// domain/interfaces/repositories/idependency.repository.ts
import { DependencyAssessmentAggregate } from '../../aggregates/dependency-assessment.aggregate';

export interface IDependencyRepository {
  save(assessment: DependencyAssessmentAggregate): Promise<void>;

  findById(id: string): Promise<DependencyAssessmentAggregate | null>;

  /**
   * Finds all legal dependants associated with a deceased person.
   */
  findByDeceasedId(deceasedId: string): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Finds specific dependency record between two people.
   */
  findByDeceasedAndDependant(
    deceasedId: string,
    dependantId: string,
  ): Promise<DependencyAssessmentAggregate | null>;

  /**
   * Finds dependants who have filed a court claim (S.26) but it is not yet resolved.
   */
  findPendingCourtClaims(deceasedId: string): Promise<DependencyAssessmentAggregate[]>;
}
