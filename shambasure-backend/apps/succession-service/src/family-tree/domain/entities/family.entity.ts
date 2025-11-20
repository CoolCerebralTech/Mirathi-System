import { AggregateRoot } from '@nestjs/cqrs';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMetadataUpdatedEvent } from '../events/family-metadata-updated.event';
import { FamilyArchivedEvent } from '../events/family-archived.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';

export interface TreeVisualizationData {
  nodes: any[];
  edges: any[];
  metadata: {
    generationCount: number;
    memberCount: number;
    lastCalculated: string;
  };
}

export class Family extends AggregateRoot {
  private id: string;
  private name: string;
  private description: string | null;
  private ownerId: string; // The User who manages this tree

  // Performance Optimization:
  // We store the calculated graph structure for the frontend here.
  // This prevents re-calculating recursion on every read.
  private treeData: TreeVisualizationData | null;

  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Private constructor
  private constructor(id: string, ownerId: string, name: string, description?: string) {
    super();
    this.id = id;
    this.ownerId = ownerId;
    this.name = name;
    this.description = description || null;
    this.treeData = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(id: string, ownerId: string, name: string, description?: string): Family {
    if (!name.trim()) throw new Error('Family name is required.');
    if (!ownerId) throw new Error('Family must have an owner.');

    const family = new Family(id, ownerId, name, description);

    family.apply(new FamilyCreatedEvent(id, ownerId, name));

    return family;
  }

  static reconstitute(props: any): Family {
    const family = new Family(props.id, props.ownerId, props.name, props.description);

    family.treeData = props.treeData
      ? typeof props.treeData === 'string'
        ? JSON.parse(props.treeData)
        : props.treeData
      : null;

    family.isActive = props.isActive !== undefined ? props.isActive : true;
    family.createdAt = new Date(props.createdAt);
    family.updatedAt = new Date(props.updatedAt);
    family.deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    return family;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateMetadata(name: string, description?: string): void {
    if (!name.trim()) throw new Error('Family name cannot be empty.');

    this.name = name.trim();
    if (description !== undefined) {
      this.description = description;
    }
    this.updatedAt = new Date();

    this.apply(new FamilyMetadataUpdatedEvent(this.id, this.name, this.description || undefined));
  }

  /**
   * Updates the cached visualization data.
   * Usually called by a Domain Service after adding/removing members.
   */
  updateTreeVisualization(data: TreeVisualizationData): void {
    this.treeData = data;
    this.updatedAt = new Date();
    // We emit this so the frontend can invalidate queries
    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.id));
  }

  archive(archivedBy: string): void {
    if (!this.isActive) return; // Idempotent

    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();

    this.apply(new FamilyArchivedEvent(this.id, archivedBy));
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return this.description;
  }
  getTreeData(): TreeVisualizationData | null {
    return this.treeData;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
}
