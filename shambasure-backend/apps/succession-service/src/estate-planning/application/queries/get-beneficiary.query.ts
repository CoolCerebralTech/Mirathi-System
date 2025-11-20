import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import type { BeneficiaryRepositoryInterface } from '../../domain/interfaces/beneficiary.repository.interface';
import { BeneficiaryResponseDto } from '../dto/response/beneficiary.response.dto';

export class GetBeneficiaryQuery {
  constructor(
    public readonly assignmentId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetBeneficiaryQuery)
export class GetBeneficiaryHandler implements IQueryHandler<GetBeneficiaryQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('BeneficiaryRepositoryInterface')
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface,
  ) {}

  async execute(query: GetBeneficiaryQuery): Promise<BeneficiaryResponseDto> {
    const { assignmentId, userId } = query;

    // 1. Fetch Assignment
    const assignment = await this.beneficiaryRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Beneficiary Assignment ${assignmentId} not found.`);
    }

    // 2. Verify Ownership via Will
    // This prevents ID enumeration attacks accessing other people's bequest data
    const aggregate = await this.willRepository.findById(assignment.getWillId());

    if (!aggregate || aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // 3. Return DTO
    return plainToInstance(
      BeneficiaryResponseDto,
      {
        ...assignment,
        identity: assignment.getIdentity(),
        sharePercentage: assignment.getSharePercent()?.getValue(),
        specificAmount: assignment.getSpecificAmount(),
      },
      { excludeExtraneousValues: true },
    );
  }
}
