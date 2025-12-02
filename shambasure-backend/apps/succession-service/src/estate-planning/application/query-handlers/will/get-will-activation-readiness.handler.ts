// get-will-activation-readiness.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { AssetRepository } from '../../infrastructure/repositories/asset.repository';
import { BeneficiaryAssignmentRepository } from '../../infrastructure/repositories/beneficiary-assignment.repository';
import { ExecutorRepository } from '../../infrastructure/repositories/executor.repository';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { WitnessRepository } from '../../infrastructure/repositories/witness.repository';
import { GetWillActivationReadinessQuery } from './get-will-activation-readiness.query';

interface ActivationReadinessResponse {
  willId: string;
  testatorId: string;
  isReady: boolean;
  canBeActivated: boolean;
  currentStatus: string;
  requiredStatus: string;
  missingComponents: string[];
  validationIssues: string[];
  readinessScore: number;
  recommendations: string[];
}

@QueryHandler(GetWillActivationReadinessQuery)
export class GetWillActivationReadinessHandler implements IQueryHandler<GetWillActivationReadinessQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly assetRepository: AssetRepository,
    private readonly beneficiaryRepository: BeneficiaryAssignmentRepository,
    private readonly executorRepository: ExecutorRepository,
    private readonly witnessRepository: WitnessRepository,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillActivationReadinessQuery): Promise<ActivationReadinessResponse> {
    const { willId, testatorId } = query;

    this.logger.debug(`Checking activation readiness for will ${willId}`);

    // Load the will
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will access');
    }

    // Load related entities
    const assets = await this.assetRepository.findByIds(will.assetIds);
    const beneficiaries = await this.beneficiaryRepository.findByWillId(willId);
    const executors = await this.executorRepository.findByWillId(willId);
    const witnesses = await this.witnessRepository.findByWillId(willId);

    // Check components
    const missingComponents: string[] = [];
    const validationIssues: string[] = [];
    const recommendations: string[] = [];

    // 1. Assets check
    if (assets.length === 0) {
      missingComponents.push('No assets assigned');
    } else {
      // Check if assets are valid for distribution
      const invalidAssets = assets.filter((asset) => !asset.canBeTransferred());
      if (invalidAssets.length > 0) {
        validationIssues.push(`${invalidAssets.length} assets cannot be transferred`);
      }
    }

    // 2. Beneficiaries check
    if (beneficiaries.length === 0) {
      missingComponents.push('No beneficiaries assigned');
    } else {
      // Check if beneficiaries have valid allocations
      const invalidBeneficiaries = beneficiaries.filter((b) => !b.hasValidAllocation());
      if (invalidBeneficiaries.length > 0) {
        validationIssues.push(
          `${invalidBeneficiaries.length} beneficiaries have invalid allocations`,
        );
      }
    }

    // 3. Executors check
    if (executors.length === 0) {
      missingComponents.push('No executors nominated');
    } else {
      // Check if executors are eligible
      const ineligibleExecutors = executors.filter((e) => e.eligibilityStatus !== 'ELIGIBLE');
      if (ineligibleExecutors.length > 0) {
        validationIssues.push(`${ineligibleExecutors.length} executors are not eligible`);
      }
    }

    // 4. Witnesses check
    if (witnesses.length < will.minimumWitnessesRequired) {
      missingComponents.push(
        `Insufficient witnesses (${witnesses.length}/${will.minimumWitnessesRequired})`,
      );
    } else {
      // Check if witnesses are verified
      const unverifiedWitnesses = witnesses.filter((w) => w.status !== 'VERIFIED');
      if (unverifiedWitnesses.length > 0) {
        validationIssues.push(`${unverifiedWitnesses.length} witnesses are not verified`);
      }
    }

    // 5. Legal capacity check
    if (will.legalCapacityStatus !== 'ASSESSED_COMPETENT') {
      missingComponents.push('Legal capacity not assessed as competent');
    }

    // 6. Formalities check
    if (!will.hasTestatorSignature) {
      missingComponents.push('Testator signature missing');
    }

    if (!will.signatureWitnessed) {
      missingComponents.push('Signatures not witnessed');
    }

    // 7. Status check
    const requiredStatus = 'WITNESSED';
    if (will.status !== requiredStatus) {
      validationIssues.push(`Will status must be ${requiredStatus} (current: ${will.status})`);
    }

    // Calculate readiness score
    const totalChecks = 7; // assets, beneficiaries, executors, witnesses, capacity, signature, status
    const passedChecks = totalChecks - missingComponents.length - validationIssues.length;
    const readinessScore = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

    // Generate recommendations
    if (missingComponents.length > 0) {
      recommendations.push('Complete all required components');
    }
    if (validationIssues.length > 0) {
      recommendations.push('Resolve validation issues');
    }
    if (will.status !== 'WITNESSED') {
      recommendations.push('Mark will as witnessed once all requirements are met');
    }

    // Determine if ready
    const canBeActivated =
      will.status === 'WITNESSED' &&
      missingComponents.length === 0 &&
      validationIssues.length === 0;
    const isReady = canBeActivated;

    const response: ActivationReadinessResponse = {
      willId: will.id,
      testatorId: will.testatorId,
      isReady,
      canBeActivated,
      currentStatus: will.status,
      requiredStatus: 'WITNESSED',
      missingComponents,
      validationIssues,
      readinessScore,
      recommendations,
    };

    this.logger.debug(`Activation readiness for will ${willId}: ${readinessScore}% ready`);
    return response;
  }
}
