import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { MarriageRepositoryInterface } from '../../domain/interfaces/marriage.repository.interface';
import { MarriageResponseDto } from '../dto/response/marriage.response.dto';

export class GetMemberMarriagesQuery {
  constructor(
    public readonly memberId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetMemberMarriagesQuery)
export class GetMemberMarriagesHandler implements IQueryHandler<GetMemberMarriagesQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepository: MarriageRepositoryInterface,
  ) {}

  async execute(query: GetMemberMarriagesQuery): Promise<MarriageResponseDto[]> {
    const { memberId, userId } = query;

    // 1. Validate Member & Access
    const member = await this.memberRepository.findById(memberId);
    if (!member) throw new NotFoundException('Member not found');

    const family = await this.familyRepository.findById(member.getFamilyId());
    if (!family || family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Fetch
    const marriages = await this.marriageRepository.findByMemberId(memberId);

    // 3. Map
    return marriages.map((m) =>
      plainToInstance(MarriageResponseDto, m, { excludeExtraneousValues: true }),
    );
  }
}
