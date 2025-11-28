import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import {
  DependantCalculatorService,
  IdentifiedDependant,
} from '../../domain/services/dependant-calculator.service';

export class FindPotentialHeirsQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

// Response type specific to this query
export class PotentialHeirResponse {
  id: string;
  fullName: string;
  relationship: string;
  priority: 'PRIMARY' | 'SECONDARY' | 'OTHER';
  isMinor: boolean;
  legalRationale: string; // e.g. "Section 29(1): Biological Child"
}

@QueryHandler(FindPotentialHeirsQuery)
export class FindPotentialHeirsHandler implements IQueryHandler<FindPotentialHeirsQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    private readonly calculatorService: DependantCalculatorService,
  ) {}

  async execute(query: FindPotentialHeirsQuery): Promise<PotentialHeirResponse[]> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Identify Root Member (The User)
    const rootMember = await this.memberRepository.findByUserId(userId);
    if (!rootMember) throw new NotFoundException('Root user node not found in tree.');

    // 3. Run Domain Service
    const results: IdentifiedDependant[] = await this.calculatorService.identifyLegalDependants(
      familyId,
      rootMember.getId(),
    );

    // 4. Map to Response
    return results.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      relationship: r.relationshipToTestator,
      isMinor: r.isMinor,
      priority: r.priority === 1 ? 'PRIMARY' : 'SECONDARY',
      legalRationale: this.getRationale(r.relationshipToTestator, r.priority),
    }));
  }

  private getRationale(rel: string, priority: number): string {
    if (priority === 1) return 'Section 29(1): Primary Dependant';
    if (rel === 'PARENT') return 'Section 29(2): Conditional Dependant (if maintained)';
    return 'Extended Family';
  }
}
