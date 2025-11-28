import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyMemberResponseDto } from '../dto/response/family-member.response.dto';

export class GetFamilyMembersQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetFamilyMembersQuery)
export class GetFamilyMembersHandler implements IQueryHandler<GetFamilyMembersQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
  ) {}

  async execute(query: GetFamilyMembersQuery): Promise<FamilyMemberResponseDto[]> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException('Family not found.');
    if (family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Fetch Members
    const members = await this.memberRepository.findByFamilyId(familyId);

    // 3. Map
    return members.map((member) =>
      plainToInstance(FamilyMemberResponseDto, member, { excludeExtraneousValues: true }),
    );
  }
}
