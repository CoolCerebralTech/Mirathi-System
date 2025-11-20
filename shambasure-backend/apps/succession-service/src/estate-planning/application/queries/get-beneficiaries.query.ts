import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import type { BeneficiaryRepositoryInterface } from '../../domain/interfaces/beneficiary.repository.interface';
import { BeneficiaryResponseDto } from '../dto/response/beneficiary.response.dto';

export class GetBeneficiariesQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // The Testator
  ) {}
}

@QueryHandler(GetBeneficiariesQuery)
export class GetBeneficiariesHandler implements IQueryHandler<GetBeneficiariesQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    @Inject('BeneficiaryRepositoryInterface')
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface,
  ) {}

  async execute(query: GetBeneficiariesQuery): Promise<BeneficiaryResponseDto[]> {
    const { willId, userId } = query;

    // 1. Validate Will Access
    // We need to check if the user owns the will before showing beneficiaries
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) {
      throw new NotFoundException(`Will ${willId} not found.`);
    }

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('You do not have permission to view these beneficiaries.');
    }

    // 2. Fetch Assignments
    const assignments = await this.beneficiaryRepository.findByWillId(willId);

    // 3. Map to DTO
    return assignments.map((assignment) =>
      plainToInstance(
        BeneficiaryResponseDto,
        {
          ...assignment, // Getters
          identity: assignment.getIdentity(),
          sharePercentage: assignment.getSharePercent()?.getValue(), // Flatten VO
          specificAmount: assignment.getSpecificAmount(), // Flatten VO
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
