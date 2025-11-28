import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyMemberResponseDto } from '../dto/response/family-member.response.dto';

export class GetFamilyMemberQuery {
  constructor(
    public readonly memberId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetFamilyMemberQuery)
export class GetFamilyMemberHandler implements IQueryHandler<GetFamilyMemberQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
  ) {}

  async execute(query: GetFamilyMemberQuery): Promise<FamilyMemberResponseDto> {
    const { memberId, userId } = query;

    const member = await this.memberRepository.findById(memberId);
    if (!member) throw new NotFoundException('Member not found.');

    // Access Check via Family Root
    const family = await this.familyRepository.findById(member.getFamilyId());
    if (!family || family.getOwnerId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    return plainToInstance(FamilyMemberResponseDto, member, { excludeExtraneousValues: true });
  }
}
