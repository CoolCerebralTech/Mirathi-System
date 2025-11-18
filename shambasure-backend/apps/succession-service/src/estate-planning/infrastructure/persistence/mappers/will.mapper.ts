import { WillStatus } from '@prisma/client';
import { Will } from '../../../domain/entities/will.entity';
import { LegalCapacity } from '../../../domain/value-objects/legal-capacity.vo';

export class WillMapper {
  static toDomain(prismaWill: any): Will {
    if (!prismaWill) return null;

    const will = new Will(
      prismaWill.id,
      prismaWill.title,
      prismaWill.testatorId,
      prismaWill.createdAt,
      prismaWill.updatedAt,
    );

    // Set all properties via reflection or direct assignment
    // This is a simplified mapping - in reality, we'd use more sophisticated mapping
    Object.assign(will, {
      status: prismaWill.status as WillStatus,
      willDate: prismaWill.willDate,
      lastModified: prismaWill.lastModified,
      versionNumber: prismaWill.versionNumber,
      supersedes: prismaWill.supersedes,
      activatedAt: prismaWill.activatedAt,
      activatedBy: prismaWill.activatedBy,
      executedAt: prismaWill.executedAt,
      executedBy: prismaWill.executedBy,
      revokedAt: prismaWill.revokedAt,
      revokedBy: prismaWill.revokedBy,
      revocationReason: prismaWill.revocationReason,
      funeralWishes: prismaWill.funeralWishes,
      burialLocation: prismaWill.burialLocation,
      residuaryClause: prismaWill.residuaryClause,
      requiresWitnesses: prismaWill.requiresWitnesses,
      witnessCount: prismaWill.witnessCount,
      hasAllWitnesses: prismaWill.hasAllWitnesses,
      digitalAssetInstructions: prismaWill.digitalAssetInstructions,
      specialInstructions: prismaWill.specialInstructions,
      isActive: prismaWill.isActive,
      deletedAt: prismaWill.deletedAt,
    });

    // Map legal capacity if available
    if (prismaWill.legalCapacity) {
      const legalCapacity = new LegalCapacity(
        prismaWill.legalCapacity.assessment,
        prismaWill.legalCapacity.notes,
      );
      // Use reflection to set private field or add setter method
    }

    return will;
  }

  static toPersistence(will: Will): any {
    return {
      id: will.getId(),
      title: will.getTitle(),
      status: will.getStatus(),
      testatorId: will.getTestatorId(),
      willDate: will.getWillDate(),
      lastModified: will.getLastModified(),
      versionNumber: will.getVersionNumber(),
      supersedes: will.getSupersedes(),
      activatedAt: will.getActivatedAt(),
      activatedBy: will.getActivatedBy(),
      executedAt: will.getExecutedAt(),
      executedBy: will.getExecutedBy(),
      revokedAt: will.getRevokedAt(),
      revokedBy: will.getRevokedBy(),
      revocationReason: will.getRevocationReason(),
      funeralWishes: will.getFuneralWishes(),
      burialLocation: will.getBurialLocation(),
      residuaryClause: will.getResiduaryClause(),
      requiresWitnesses: will.getRequiresWitnesses(),
      witnessCount: will.getWitnessCount(),
      hasAllWitnesses: will.getHasAllWitnesses(),
      digitalAssetInstructions: will.getDigitalAssetInstructions(),
      specialInstructions: will.getSpecialInstructions(),
      isActive: will.getIsActive(),
      createdAt: will.getCreatedAt(),
      updatedAt: will.getUpdatedAt(),
      deletedAt: will.getDeletedAt(),
    };
  }

  static toDomainList(prismaWills: any[]): Will[] {
    return prismaWills.map((will) => this.toDomain(will)).filter(Boolean);
  }
}
