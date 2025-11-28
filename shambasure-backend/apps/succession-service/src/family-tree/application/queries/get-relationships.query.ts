import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';
import { RelationshipResponseDto } from '../dto/response/relationship.response.dto';

export class GetRelationshipsQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetRelationshipsQuery)
export class GetRelationshipsHandler implements IQueryHandler<GetRelationshipsQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
  ) {}

  async execute(query: GetRelationshipsQuery): Promise<RelationshipResponseDto[]> {
    const { familyId, userId } = query;

    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    const relationships = await this.relationshipRepository.findByFamilyId(familyId);

    return relationships.map((r) =>
      plainToInstance(RelationshipResponseDto, r, { excludeExtraneousValues: true }),
    );
  }
}
