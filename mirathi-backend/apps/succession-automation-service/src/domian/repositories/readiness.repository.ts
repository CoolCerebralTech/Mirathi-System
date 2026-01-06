import { ReadinessAssessment } from '../entities/readiness-assessment.entity';
import { RiskFlag } from '../entities/risk-flag.entity';

// Injection Token
export const READINESS_ASSESSMENT_REPO = 'READINESS_ASSESSMENT_REPO';

export interface IReadinessAssessmentRepository {
  /**
   * Finds the assessment for a specific estate.
   */
  findByEstateId(estateId: string): Promise<ReadinessAssessment | null>;

  /**
   * Saves or Updates the assessment.
   */
  save(assessment: ReadinessAssessment): Promise<void>;

  /**
   * Saves a list of identified risks.
   */
  saveRisks(risks: RiskFlag[]): Promise<void>;

  /**
   * Retrieves active risks for an assessment.
   */
  getRisks(assessmentId: string): Promise<RiskFlag[]>;
}
