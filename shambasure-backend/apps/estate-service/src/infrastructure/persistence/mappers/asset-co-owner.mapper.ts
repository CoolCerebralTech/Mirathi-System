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
    if (!prismaAssetCoOwner) return null;

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

    const coOwnerProps = {
      assetId,
      familyMemberId,
      sharePercentage: Number(sharePercentage),
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

    return AssetCoOwner.create(
      {
        ...coOwnerProps,
      },
      new UniqueEntityID(id),
    );
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(assetCoOwner: AssetCoOwner): Partial<PrismaAssetCoOwner> {
    const props = assetCoOwner.getProps();

    return {
      id: assetCoOwner.id.toString(),
      assetId: props.assetId,
      familyMemberId: props.familyMemberId,
      sharePercentage: props.sharePercentage,
      ownershipType: this.mapToPrismaOwnershipType(props.ownershipType),
      evidenceOfOwnership: props.evidenceOfOwnership || null,
      ownershipDate: props.ownershipDate || null,
      purchasePrice: props.purchasePrice || null,
      isActive: props.isActive,
      isVerified: props.isVerified,
      verificationNotes: props.verificationNotes || null,
      verifiedBy: props.verifiedBy || null,
      verifiedAt: props.verifiedAt || null,
      createdBy: props.createdBy,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt || null,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaAssetCoOwners: PrismaAssetCoOwner[]): AssetCoOwner[] {
    return prismaAssetCoOwners
      .map((coOwner) => this.toDomain(coOwner))
      .filter((coOwner) => coOwner !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(assetCoOwners: AssetCoOwner[]): Partial<PrismaAssetCoOwner>[] {
    return assetCoOwners.map((coOwner) => this.toPersistence(coOwner));
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
        throw new Error(`Unknown ownership type: ${prismaType}`);
    }
  }

  /**
   * Map Domain ownership type to Prisma enum
   */
  private mapToPrismaOwnershipType(domainType: CoOwnershipType): string {
    switch (domainType) {
      case CoOwnershipType.JOINT_TENANCY:
        return 'JOINT_TENANCY';
      case CoOwnershipType.TENANCY_IN_COMMON:
        return 'TENANCY_IN_COMMON';
      default:
        throw new Error(`Unknown ownership type: ${domainType}`);
    }
  }

  /**
   * Extract co-ownership summary from Domain Entity
   */
  toCoOwnershipSummary(assetCoOwners: AssetCoOwner[]): {
    totalSharePercentage: number;
    ownershipType?: CoOwnershipType;
    activeCount: number;
    verifiedCount: number;
  } {
    const activeCoOwners = assetCoOwners.filter((co) => co.isActive);
    const verifiedCoOwners = assetCoOwners.filter((co) => co.isActive && co.isVerified);

    const totalSharePercentage = activeCoOwners.reduce(
      (sum, coOwner) => sum + coOwner.sharePercentage,
      0,
    );

    // Determine ownership type (if consistent among active co-owners)
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
   * Prepare bulk create data for new co-owners
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
  ): Partial<PrismaAssetCoOwner>[] {
    const now = new Date();

    return coOwners.map((coOwner) => ({
      id: new UniqueEntityID().toString(),
      assetId,
      familyMemberId: coOwner.familyMemberId,
      sharePercentage: coOwner.sharePercentage,
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

  /**
   * Filter co-owners that are ready for estate calculation
   */
  filterReadyForInclusion(assetCoOwners: AssetCoOwner[]): AssetCoOwner[] {
    return assetCoOwners.filter((coOwner) => {
      const props = coOwner.getProps();
      return props.isActive && props.isVerified;
    });
  }
}
