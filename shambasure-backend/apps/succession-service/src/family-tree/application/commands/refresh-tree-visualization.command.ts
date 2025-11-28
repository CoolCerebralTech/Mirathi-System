import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyTreeBuilderService } from '../../domain/services/family-tree-builder.service';

export class RefreshTreeVisualizationCommand {
  constructor(public readonly familyId: string) {}
}

@CommandHandler(RefreshTreeVisualizationCommand)
export class RefreshTreeVisualizationHandler implements ICommandHandler<RefreshTreeVisualizationCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    private readonly treeBuilder: FamilyTreeBuilderService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RefreshTreeVisualizationCommand): Promise<void> {
    const { familyId } = command;

    // 1. Load Family Root
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException(`Family ${familyId} not found.`);

    // 2. Calculate Heavy Graph Data
    // This service fetches all nodes/edges and builds the JSON
    const graphData = await this.treeBuilder.buildFullTree(familyId);

    // 3. Update Aggregate Cache
    const familyModel = this.publisher.mergeObjectContext(family);

    familyModel.updateTreeVisualization({
      nodes: graphData.nodes,
      edges: graphData.edges,
      metadata: {
        generationCount: 0, // Logic to calculate depth could be added to builder
        memberCount: graphData.nodes.length,
        lastCalculated: new Date().toISOString(),
      },
    });

    // 4. Save
    await this.familyRepository.save(familyModel);
    familyModel.commit();
  }
}
