import { Family as PrismaFamily, Prisma } from '@prisma/client';
import {
  Family,
  TreeVisualizationData,
  KenyanFamilyMetadata,
} from '../../../domain/entities/family.entity';

export class FamilyMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaFamily): Family {
    // 1. Safe JSON extraction
    // We check if it is an object to avoid unsafe assignment errors
    let treeData: TreeVisualizationData | null = null;

    if (raw.treeData && typeof raw.treeData === 'object' && !Array.isArray(raw.treeData)) {
      // Double cast to satisfy eslint: any -> unknown -> Type
      treeData = raw.treeData as unknown as TreeVisualizationData;
    }

    // 2. Default metadata (Since schema lacks these columns)
    const metadata: KenyanFamilyMetadata = {
      hasCustomaryMarriage: false,
      hasPolygamousMarriage: false,
      familyHeadId: undefined,
      clanName: undefined,
      subClan: undefined,
      ancestralHome: undefined,
      familyTotem: undefined,
    };

    return Family.reconstitute({
      id: raw.id,
      creatorId: raw.creatorId,
      name: raw.name,
      description: raw.description || undefined,
      metadata: metadata,
      treeData: treeData,
      isActive: !raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      memberCount: 0,
      livingMemberCount: 0,
      minorCount: 0,
    });
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format (Model)
   */
  static toPersistence(entity: Family): PrismaFamily {
    const treeData = entity.getTreeData();

    // FIX: When returning the Model (PrismaFamily), use 'null', NOT 'Prisma.JsonNull'.
    // Prisma.JsonNull is ONLY for Input types (create/update), not for the Model definition.
    const treeDataJson = treeData
      ? (JSON.parse(JSON.stringify(treeData)) as Prisma.JsonObject)
      : null;

    return {
      id: entity.getId(),
      name: entity.getName(),
      description: entity.getDescription() || null,
      creatorId: entity.getCreatorId(),

      // Strict Type: Prisma.JsonValue | null
      treeData: treeDataJson,

      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    };
  }
}
