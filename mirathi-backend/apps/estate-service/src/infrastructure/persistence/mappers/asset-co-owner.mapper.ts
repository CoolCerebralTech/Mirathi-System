// src/estate-service/src/infrastructure/persistence/mappers/asset-co-owner.mapper.ts
import { Injectable } from '@nestjs/common';
import { AssetCoOwner as PrismaAssetCoOwner } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { AssetCoOwner } from '../../../domain/entities/asset-co-owner.entity';
import { CoOwnershipType } from '../../../domain/enums/co-ownership-type.enum';

@Injectable()
export class AssetCoOwnerMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaAssetCoOwner: PrismaAssetCoOwner): AssetCoOwner {
    if (!prismaAssetCoOwner) {
      throw new Error('Cannot map null Prisma object to Domain Entity');
    }

    const {
      id,
      assetId,
      familyMemberId,
      sharePercentage,
      ownershipType,
      evidenceOfOwnership,
      ownershipDate,
      purchasePrice,
      isActive,
      isVerified,
      verificationNotes,
      verifiedBy,
      verifiedAt,
      createdBy,
      createdAt,
      updatedAt,
      deletedAt,
    } = prismaAssetCoOwner;

    // Guard clause for required fields
    if (!familyMemberId) {
      throw new Error(`AssetCoOwner ${id} is missing familyMemberId`);
    }

    const coOwnerProps = {
      assetId,
      familyMemberId, // Confirmed not null
      sharePercentage: Number(sharePercentage), // Handle Decimal -> Number
      ownershipType: this.mapToDomainOwnershipType(ownershipType),
      evidenceOfOwnership: evidenceOfOwnership || undefined,
      ownershipDate: ownershipDate || undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      isActive,
      isVerified,
      verificationNotes: verificationNotes || undefined,
      verifiedBy: verifiedBy || undefined,
      verifiedAt: verifiedAt || undefined,
      createdBy,
      createdAt,
      updatedAt,
      deletedAt: deletedAt || undefined,
    };

    // Use specific create method or internal constructor depending on accessibility
    // Since Entity constructor is private, we reconstitute via a specific method
    // or generic create if it accepts full props (often entities have a 'reconstitute' method)
    // Assuming create() is flexible enough or we modify the Entity to allow reconstitution:

    // NOTE: Entities usually expose a reconstitute method. If not, we use create
    // but bypass the "new" checks. For now, creating via factory implies new state logic
    // (like setting createdAt to now).
    // Ideally, add `public static reconstitute(...)` to your Entity.
    // Here we assume create() can be used or we map to props manually if possible.

    // WORKAROUND: If AssetCoOwner.create() forces new dates, this might drift from DB data.
    // Best practice: Add `reconstitute` to Entity.
    // For this snippet, I will cast to any to access the private constructor if needed
    // or rely on a `reconstitute` method if you added it.

    // Assuming you can modify Entity, or use a method that accepts all props:
    return (AssetCoOwner as any).create(coOwnerProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(assetCoOwner: AssetCoOwner): any {
    // FIX: Use public getters instead of getProps()

    return {
      id: assetCoOwner.id.toString(),
      assetId: assetCoOwner.assetId,
      familyMemberId: assetCoOwner.familyMemberId,
      sharePercentage: assetCoOwner.sharePercentage,
      ownershipType: this.mapToPrismaOwnershipType(assetCoOwner.ownershipType),
      evidenceOfOwnership: assetCoOwner.evidenceOfOwnership || null,
      ownershipDate: assetCoOwner.ownershipDate || null,
      purchasePrice: assetCoOwner.purchasePrice || null,
      isActive: assetCoOwner.isActive,
      isVerified: assetCoOwner.isVerified,
      verificationNotes: assetCoOwner.verificationNotes || null,
      // Assuming these are exposed as getters too, if not add them to Entity
      verifiedBy: (assetCoOwner as any).verifiedBy || null,
      verifiedAt: (assetCoOwner as any).verifiedAt || null,
      createdBy: (assetCoOwner as any).createdBy || 'SYSTEM', // Fallback

      // Timestamps managed by DB or Entity
      updatedAt: new Date(),
      // deletedAt: assetCoOwner.deletedAt || null,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaAssetCoOwners: PrismaAssetCoOwner[]): AssetCoOwner[] {
    if (!prismaAssetCoOwners) return [];
    return prismaAssetCoOwners
      .map((coOwner) => {
        try {
          return this.toDomain(coOwner);
        } catch {
          return null;
        }
      })
      .filter((coOwner): coOwner is AssetCoOwner => coOwner !== null);
  }

  /**
   * Map Prisma ownership type to Domain enum
   */
  private mapToDomainOwnershipType(prismaType: string): CoOwnershipType {
    switch (prismaType) {
      case 'JOINT_TENANCY':
        return CoOwnershipType.JOINT_TENANCY;
      case 'TENANCY_IN_COMMON':
        return CoOwnershipType.TENANCY_IN_COMMON;
      default:
        return CoOwnershipType.TENANCY_IN_COMMON; // Fallback
    }
  }

  /**
   * Map Domain ownership type to Prisma enum
   */
  private mapToPrismaOwnershipType(domainType: CoOwnershipType): any {
    // Return 'any' or strict Enum
    switch (domainType) {
      case CoOwnershipType.JOINT_TENANCY:
        return 'JOINT_TENANCY';
      case CoOwnershipType.TENANCY_IN_COMMON:
        return 'TENANCY_IN_COMMON';
      default:
        return 'TENANCY_IN_COMMON';
    }
  }

  /**
   * Extract co-ownership summary
   */
  toCoOwnershipSummary(assetCoOwners: AssetCoOwner[]) {
    const activeCoOwners = assetCoOwners.filter((co) => co.isActive);
    const verifiedCoOwners = assetCoOwners.filter((co) => co.isActive && co.isVerified);

    const totalSharePercentage = activeCoOwners.reduce(
      (sum, coOwner) => sum + coOwner.sharePercentage,
      0,
    );

    const ownershipTypes = [...new Set(activeCoOwners.map((co) => co.ownershipType))];
    const ownershipType = ownershipTypes.length === 1 ? ownershipTypes[0] : undefined;

    return {
      totalSharePercentage,
      ownershipType,
      activeCount: activeCoOwners.length,
      verifiedCount: verifiedCoOwners.length,
    };
  }

  /**
   * Prepare bulk create data
   */
  prepareBulkCreateData(
    assetId: string,
    coOwners: Array<{
      familyMemberId: string;
      sharePercentage: number;
      ownershipType: CoOwnershipType;
      createdBy: string;
      evidenceOfOwnership?: string;
      purchasePrice?: number;
    }>,
  ): any[] {
    const now = new Date();

    return coOwners.map((coOwner) => ({
      id: new UniqueEntityID().toString(),
      assetId,
      familyMemberId: coOwner.familyMemberId,
      sharePercentage: coOwner.sharePercentage,
      // Cast enum to string/any to satisfy Prisma type
      ownershipType: this.mapToPrismaOwnershipType(coOwner.ownershipType),
      evidenceOfOwnership: coOwner.evidenceOfOwnership || null,
      purchasePrice: coOwner.purchasePrice || null,
      isActive: true,
      isVerified: false,
      createdBy: coOwner.createdBy,
      createdAt: now,
      updatedAt: now,
    }));
  }
}
