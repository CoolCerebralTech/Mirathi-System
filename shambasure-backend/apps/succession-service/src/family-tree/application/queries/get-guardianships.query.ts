import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { GuardianshipRepositoryInterface } from '../../domain/interfaces/guardianship.repository.interface';
import { GuardianshipResponseDto } from '../dto/response/guardianship.response.dto';

export class GetGuardianshipsQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetGuardianshipsQuery)
export class GetGuardianshipsHandler implements IQueryHandler<GetGuardianshipsQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepository: GuardianshipRepositoryInterface,
  ) {}

  async execute(query: GetGuardianshipsQuery): Promise<GuardianshipResponseDto[]> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // 2. Fetch Active Records
    // Uses the efficient repository method that checks dates/flags
    const records = await this.guardianshipRepository.findActiveByFamilyId(familyId);

    // 3. Map
    return records.map((g) =>
      plainToInstance(GuardianshipResponseDto, g, { excludeExtraneousValues: true }),
    );
  }
}
