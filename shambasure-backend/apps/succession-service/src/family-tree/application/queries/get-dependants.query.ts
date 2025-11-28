import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import {
  DependantCalculatorService,
  IdentifiedDependant,
} from '../../domain/services/dependant-calculator.service';

export class GetDependantsQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

// We reuse the response structure defined in the service, or create a specific DTO
// For simplicity, we return the interface structure which is safe to serialize
export { IdentifiedDependant };

@QueryHandler(GetDependantsQuery)
export class GetDependantsHandler implements IQueryHandler<GetDependantsQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    private readonly calculatorService: DependantCalculatorService,
  ) {}

  async execute(query: GetDependantsQuery): Promise<IdentifiedDependant[]> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // 2. Find Root Node (The User)
    const rootMember = await this.memberRepository.findByUserId(userId);
    if (!rootMember) {
      throw new NotFoundException('Root user node not found in this family tree.');
    }

    // 3. Execute Domain Service
    return this.calculatorService.identifyLegalDependants(familyId, rootMember.getId());
  }
}
