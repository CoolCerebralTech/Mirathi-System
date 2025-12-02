// get-will-compliance-status.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { GetWillComplianceStatusQuery } from './get-will-compliance-status.query';

interface ComplianceStatusResponse {
  willId: string;
  testatorId: string;
  isLegallyValid: boolean;
  meetsKenyanFormalities: boolean;
  legalCapacityAssessed: boolean;
  hasTestatorSignature: boolean;
  hasMinimumWitnesses: boolean;
  signatureWitnessed: boolean;
  isRevoked: boolean;
  missingRequirements: string[];
  complianceScore: number;
  status: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
}

@QueryHandler(GetWillComplianceStatusQuery)
export class GetWillComplianceStatusHandler implements IQueryHandler<GetWillComplianceStatusQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillComplianceStatusQuery): Promise<ComplianceStatusResponse> {
    const { willId, testatorId } = query;

    this.logger.debug(`Fetching compliance status for will ${willId}`);

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

    // Calculate compliance metrics
    const requirements = [
      { name: 'Legal Capacity Assessed', met: will.legalCapacityStatus === 'ASSESSED_COMPETENT' },
      { name: 'Testator Signature', met: will.hasTestatorSignature },
      { name: 'Minimum Witnesses', met: will.witnessCount >= will.minimumWitnessesRequired },
      { name: 'Signature Witnessed', met: will.signatureWitnessed },
      { name: 'Not Revoked', met: !will.isRevoked },
      { name: 'Kenyan Formalities', met: will.meetsKenyanFormalities },
    ];

    const metRequirements = requirements.filter((req) => req.met).length;
    const totalRequirements = requirements.length;
    const complianceScore = Math.round((metRequirements / totalRequirements) * 100);

    const missingRequirements = requirements.filter((req) => !req.met).map((req) => req.name);

    let status: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
    if (complianceScore === 100) {
      status = 'COMPLIANT';
    } else if (complianceScore >= 50) {
      status = 'PARTIALLY_COMPLIANT';
    } else {
      status = 'NON_COMPLIANT';
    }

    const response: ComplianceStatusResponse = {
      willId: will.id,
      testatorId: will.testatorId,
      isLegallyValid: will.meetsKenyanLegalRequirements && !will.isRevoked,
      meetsKenyanFormalities: will.meetsKenyanFormalities,
      legalCapacityAssessed: will.legalCapacityStatus === 'ASSESSED_COMPETENT',
      hasTestatorSignature: will.hasTestatorSignature,
      hasMinimumWitnesses: will.witnessCount >= will.minimumWitnessesRequired,
      signatureWitnessed: will.signatureWitnessed,
      isRevoked: will.isRevoked,
      missingRequirements,
      complianceScore,
      status,
    };

    this.logger.debug(
      `Compliance status fetched for will ${willId}: ${status} (${complianceScore}%)`,
    );
    return response;
  }
}
