import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyTreeBuilderService } from '../../domain/services/family-tree-builder.service';
import { FamilyTreeResponseDto } from '../dto/response/family-tree.response.dto';

export class GetFamilyTreeQuery {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetFamilyTreeQuery)
export class GetFamilyTreeHandler implements IQueryHandler<GetFamilyTreeQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    private readonly treeBuilder: FamilyTreeBuilderService,
  ) {}

  async execute(query: GetFamilyTreeQuery): Promise<FamilyTreeResponseDto> {
    const { familyId, userId } = query;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException(`Family ${familyId} not found.`);
    if (family.getOwnerId() !== userId) throw new ForbiddenException('Access denied.');

    // 2. Fetch Graph Data
    // Strategy: Check Cache -> Fallback to Live Build
    let graphData = family.getTreeData();

    if (!graphData) {
      // Cache miss or first load: Calculate live
      graphData = await this.treeBuilder.buildFullTree(familyId);
      // Note: We don't save back to DB here to keep Query side pure (read-only).
      // The Command side handles cache updates.
    }

    // 3. Construct DTO
    return plainToInstance(
      FamilyTreeResponseDto,
      {
        familyId: family.getId(),
        nodes: graphData.nodes,
        edges: graphData.edges,
        stats: graphData.metadata,
      },
      { excludeExtraneousValues: true },
    );
  }
}
