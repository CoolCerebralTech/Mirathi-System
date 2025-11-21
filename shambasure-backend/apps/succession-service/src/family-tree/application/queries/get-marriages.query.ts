import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { MarriageRepositoryInterface } from '../../domain/interfaces/marriage.repository.interface';
import { MarriageResponseDto } from '../dto/response/marriage.response.dto';

export class GetMarriagesQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetMarriagesQuery)
export class GetMarriagesHandler implements IQueryHandler<GetMarriagesQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepository: MarriageRepositoryInterface,
  ) {}

  async execute(query: GetMarriagesQuery): Promise<MarriageResponseDto[]> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException(`Family ${familyId} not found.`);
    if (family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Fetch
    const marriages = await this.marriageRepository.findByFamilyId(familyId);

    // 3. Map
    return marriages.map((m) =>
      plainToInstance(MarriageResponseDto, m, { excludeExtraneousValues: true }),
    );
  }
}
