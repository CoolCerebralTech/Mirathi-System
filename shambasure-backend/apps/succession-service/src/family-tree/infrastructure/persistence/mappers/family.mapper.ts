// succession-service/src/family-tree/infrastructure/persistence/mappers/family.mapper.ts

import { Family as PrismaFamily } from '@prisma/client';
import { Family, TreeVisualizationData } from '../../../domain/entities/family.entity';

export class FamilyMapper {
  /**
   * Domain -> Database
   */
  static toPersistence(domain: Family): PrismaFamily {
    const treeData = domain.getTreeData();

    return {
      id: domain.getId(),
      name: domain.getName(),
      description: domain.getDescription(),
      creatorId: domain.getOwnerId(), // Mapping 'ownerId' domain to 'creatorId' schema

      // Prisma handles JSON types automatically, but strict typing requires casting
      treeData: treeData ? (treeData as any) : null,

      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
      deletedAt: domain.getDeletedAt(),
    } as unknown as PrismaFamily; // Cast to bypass strict Prisma Generated Types
  }

  /**
   * Database -> Domain
   */
  static toDomain(raw: PrismaFamily): Family {
    // Handle JSON deserialization if necessary (though Prisma client usually returns objects)
    let treeData: TreeVisualizationData | null = null;

    if (raw.treeData) {
      treeData =
        typeof raw.treeData === 'string'
          ? JSON.parse(raw.treeData)
          : (raw.treeData as unknown as TreeVisualizationData);
    }

    // Note: The schema uses 'creatorId', Domain uses 'ownerId' property name.
    // We map them here.
    return Family.reconstitute({
      id: raw.id,
      ownerId: raw.creatorId,
      name: raw.name,
      description: raw.description,
      treeData: treeData,
      isActive: raw.deletedAt === null, // Derived active state
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
