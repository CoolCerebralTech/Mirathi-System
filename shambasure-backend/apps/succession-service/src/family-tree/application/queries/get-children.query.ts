import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';
import { RelationshipResponseDto } from '../dto/response/relationship.response.dto';

export class GetChildrenQuery {
  constructor(
    public readonly parentId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetChildrenQuery)
export class GetChildrenHandler implements IQueryHandler<GetChildrenQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
  ) {}

  async execute(query: GetChildrenQuery): Promise<RelationshipResponseDto[]> {
    const { parentId, userId } = query;

    // 1. Validate Parent Node
    const parent = await this.memberRepository.findById(parentId);
    if (!parent) throw new NotFoundException('Member not found');

    const family = await this.familyRepository.findById(parent.getFamilyId());
    if (!family || family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Fetch Outgoing edges of type 'PARENT' or 'CHILD' depending on edge direction
    // Our schema defines Edge as From -> To. 
    // The AddMemberCommand logic established: If adding Child, Edge is Parent -> Child.
    // So we look for edges where From = ParentID AND Type = 'PARENT' (or generic parent/child check)
    
    // We use findByFromMemberId and filter for 'PARENT' type (Standard DDD approach)
    // OR we use the specialized 'findByType' if implemented in repo.
    const outgoing = await this.relationshipRepository.findByFromMemberId(parentId);
    
    // Filter: Only keep edges where this person is the PARENT
    const childrenEdges = outgoing.filter(r => r.getType() === 'PARENT');

    // NOTE: If we supported "Child -> Parent" edges (inverse), we'd check incoming too.
    // But strict graph direction simplifies this.

    return childrenEdges.map(r => 
      plainToInstance(RelationshipResponseDto, r, { excludeExtraneousValues: true })
    );
  }
}