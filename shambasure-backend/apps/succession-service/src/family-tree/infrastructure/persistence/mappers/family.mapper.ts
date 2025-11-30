import { Prisma, Family as PrismaFamily } from '@prisma/client';

import { Family, FamilyReconstitutionProps } from '../../../domain/entities/family.entity';

export class FamilyMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaFamily): Family {
    const reconstitutionProps: FamilyReconstitutionProps = {
      id: raw.id,
      creatorId: raw.creatorId,
      name: raw.name,
      description: raw.description,

      // Kenyan Identity Fields
      clanName: raw.clanName,
      subClan: raw.subClan,
      ancestralHome: raw.ancestralHome,
      familyTotem: raw.familyTotem,
      familyHeadId: raw.familyHeadId,

      // Legal Status
      hasCustomaryMarriage: raw.hasCustomaryMarriage,
      hasPolygamousMarriage: raw.hasPolygamousMarriage,

      // Statistics - Using actual Prisma values
      memberCount: raw.memberCount,
      livingMemberCount: raw.livingMemberCount,
      minorCount: raw.minorCount,
      customaryMarriageCount: raw.customaryMarriageCount,
      polygamousMarriageCount: raw.polygamousMarriageCount,

      // Tree Data - Use Prisma.JsonValue directly as expected by domain
      treeData: raw.treeData,

      // Lifecycle
      isActive: !raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };

    return Family.reconstitute(reconstitutionProps);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Family): PrismaFamily {
    // Convert treeData to Prisma.JsonValue - handle null/undefined properly
    const treeData = entity.getTreeData();

    return {
      id: entity.getId(),
      name: entity.getName(),
      description: entity.getDescription(),
      creatorId: entity.getCreatorId(),

      // Kenyan Identity Fields
      clanName: entity.getClanName(),
      subClan: entity.getSubClan(),
      ancestralHome: entity.getAncestralHome(),
      familyTotem: entity.getFamilyTotem(),
      familyHeadId: entity.getFamilyHeadId(),

      // Legal Status
      hasCustomaryMarriage: entity.getHasCustomaryMarriage(),
      hasPolygamousMarriage: entity.getHasPolygamousMarriage(),

      // Statistics - Using default values since getters don't exist
      memberCount: 0, // Will be updated by domain logic
      livingMemberCount: 0, // Will be updated by domain logic
      minorCount: 0, // Will be updated by domain logic
      customaryMarriageCount: entity.getHasCustomaryMarriage() ? 1 : 0, // Default based on boolean
      polygamousMarriageCount: entity.getHasPolygamousMarriage() ? 1 : 0, // Default based on boolean

      // Tree Data - Use Prisma.JsonValue directly
      treeData: treeData,

      // Lifecycle
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    } as PrismaFamily;
  }

  /**
   * Converts Domain Entity to Prisma Create input
   */
  static toPrismaCreate(entity: Family): Prisma.FamilyCreateInput {
    const treeData = entity.getTreeData();

    return {
      id: entity.getId(),
      name: entity.getName(),
      description: entity.getDescription(),
      creator: {
        connect: { id: entity.getCreatorId() },
      },

      // Kenyan Identity Fields
      clanName: entity.getClanName(),
      subClan: entity.getSubClan(),
      ancestralHome: entity.getAncestralHome(),
      familyTotem: entity.getFamilyTotem(),
      familyHeadId: entity.getFamilyHeadId(),

      // Legal Status
      hasCustomaryMarriage: entity.getHasCustomaryMarriage(),
      hasPolygamousMarriage: entity.getHasPolygamousMarriage(),

      // Statistics - Using default values since getters don't exist
      memberCount: 0,
      livingMemberCount: 0,
      minorCount: 0,
      customaryMarriageCount: entity.getHasCustomaryMarriage() ? 1 : 0,
      polygamousMarriageCount: entity.getHasPolygamousMarriage() ? 1 : 0,

      // Tree Data - Handle null properly for Prisma input
      treeData: treeData === null ? Prisma.JsonNull : treeData,

      // Lifecycle - Prisma will handle createdAt/updatedAt
      deletedAt: entity.getDeletedAt(),
    };
  }

  /**
   * Converts Domain Entity to Prisma Update input
   */
  static toPrismaUpdate(entity: Family): Prisma.FamilyUpdateInput {
    const treeData = entity.getTreeData();

    return {
      name: entity.getName(),
      description: entity.getDescription(),

      // Kenyan Identity Fields
      clanName: entity.getClanName(),
      subClan: entity.getSubClan(),
      ancestralHome: entity.getAncestralHome(),
      familyTotem: entity.getFamilyTotem(),
      familyHeadId: entity.getFamilyHeadId(),

      // Legal Status
      hasCustomaryMarriage: entity.getHasCustomaryMarriage(),
      hasPolygamousMarriage: entity.getHasPolygamousMarriage(),

      // Statistics - Using default values since getters don't exist
      memberCount: 0,
      livingMemberCount: 0,
      minorCount: 0,
      customaryMarriageCount: entity.getHasCustomaryMarriage() ? 1 : 0,
      polygamousMarriageCount: entity.getHasPolygamousMarriage() ? 1 : 0,

      // Tree Data - Handle null properly for Prisma input
      treeData: treeData === null ? Prisma.JsonNull : treeData,

      // Lifecycle
      updatedAt: entity.getUpdatedAt(),
      deletedAt: entity.getDeletedAt(),
    };
  }
}
