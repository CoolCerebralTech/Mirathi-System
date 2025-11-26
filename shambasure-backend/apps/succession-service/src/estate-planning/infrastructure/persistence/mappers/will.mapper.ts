import {
  Will as PrismaWill,
  Asset as PrismaAsset,
  BeneficiaryAssignment as PrismaBeneficiary,
  WillExecutor as PrismaExecutor,
  WillWitness as PrismaWitness,
  Prisma,
} from '@prisma/client';
import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import {
  Will,
  WillReconstituteProps,
  FuneralWishes,
  DigitalAssetInstructions,
} from '../../../domain/entities/will.entity';
import { AssetMapper } from './asset.mapper';
import { BeneficiaryMapper } from './beneficiary.mapper';
import { ExecutorMapper } from './executor.mapper';
import { WitnessMapper } from './witness.mapper';

type WillWithRelations = PrismaWill & {
  assets?: PrismaAsset[];
  beneficiaries?: PrismaBeneficiary[];
  executors?: PrismaExecutor[];
  witnesses?: PrismaWitness[];
};

export class WillMapper {
  static toDomain(raw: WillWithRelations): WillAggregate {
    const funeralWishes = this.parseFuneralWishes(raw.funeralWishes);
    const digitalAssets = this.parseDigitalAssetInstructions(raw.digitalAssetInstructions);

    const rootProps: WillReconstituteProps = {
      id: raw.id,
      title: raw.title,
      testatorId: raw.testatorId,
      status: raw.status,
      willDate: raw.willDate,
      lastModified: raw.lastModified,
      versionNumber: raw.versionNumber,
      supersedes: raw.supersedes,
      activatedAt: raw.activatedAt,
      activatedBy: raw.activatedBy,
      executedAt: raw.executedAt,
      executedBy: raw.executedBy,
      revokedAt: raw.revokedAt,
      revokedBy: raw.revokedBy,
      revocationReason: raw.revocationReason,
      funeralWishes: funeralWishes,
      burialLocation: raw.burialLocation,
      residuaryClause: raw.residuaryClause,
      digitalAssetInstructions: digitalAssets,
      specialInstructions: raw.specialInstructions,
      requiresWitnesses: raw.requiresWitnesses,
      witnessCount: raw.witnessCount,
      hasAllWitnesses: raw.hasAllWitnesses,
      isActiveRecord: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      _assetIds: raw.assets ? raw.assets.map((asset) => asset.id) : [],
      _beneficiaryIds: raw.beneficiaries
        ? raw.beneficiaries.map((beneficiary) => beneficiary.id)
        : [],
      _witnessIds: raw.witnesses ? raw.witnesses.map((witness) => witness.id) : [],
      legalCapacity: null, // Remove legal capacity since we can't access private properties
    };

    const rootWill = Will.reconstitute(rootProps);

    const assets = raw.assets ? raw.assets.map((asset) => AssetMapper.toDomain(asset)) : [];
    const beneficiaries = raw.beneficiaries
      ? raw.beneficiaries.map((beneficiary) => BeneficiaryMapper.toDomain(beneficiary))
      : [];
    const executors = raw.executors
      ? raw.executors.map((executor) => ExecutorMapper.toDomain(executor))
      : [];
    const witnesses = raw.witnesses
      ? raw.witnesses.map((witness) => WitnessMapper.toDomain(witness))
      : [];

    return WillAggregate.reconstitute(rootWill, assets, beneficiaries, executors, witnesses);
  }

  static toPersistence(aggregate: WillAggregate): Prisma.WillUncheckedCreateInput {
    const entity = aggregate.getWill();

    return {
      id: entity.id,
      title: entity.title,
      testatorId: entity.testatorId,
      status: entity.status,
      willDate: entity.willDate,
      lastModified: entity.lastModified,
      versionNumber: entity.versionNumber,
      supersedes: entity.supersedes,
      activatedAt: entity.activatedAt,
      activatedBy: entity.activatedBy,
      executedAt: entity.executedAt,
      executedBy: entity.executedBy,
      revokedAt: entity.revokedAt,
      revokedBy: entity.revokedBy,
      revocationReason: entity.revocationReason,
      funeralWishes: entity.funeralWishes ? JSON.stringify(entity.funeralWishes) : null,
      burialLocation: entity.burialLocation,
      residuaryClause: entity.residuaryClause,
      digitalAssetInstructions: entity.digitalAssetInstructions
        ? JSON.stringify(entity.digitalAssetInstructions)
        : null,
      specialInstructions: entity.specialInstructions,
      requiresWitnesses: entity.requiresWitnesses,
      witnessCount: entity.witnessCount,
      hasAllWitnesses: entity.hasAllWitnesses,
      isActive: entity.isActiveRecord,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toUpdatePersistence(aggregate: WillAggregate): Prisma.WillUncheckedUpdateInput {
    const full = this.toPersistence(aggregate);

    const updatableFields: Omit<
      Prisma.WillUncheckedCreateInput,
      'id' | 'testatorId' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  private static parseFuneralWishes(funeralWishes: string | null): FuneralWishes | null {
    if (!funeralWishes) return null;

    try {
      if (typeof funeralWishes === 'string') {
        return JSON.parse(funeralWishes) as FuneralWishes;
      }
      return funeralWishes as FuneralWishes;
    } catch {
      return null;
    }
  }

  private static parseDigitalAssetInstructions(
    instructions: string | null,
  ): DigitalAssetInstructions | null {
    if (!instructions) return null;

    try {
      if (typeof instructions === 'string') {
        return JSON.parse(instructions) as DigitalAssetInstructions;
      }
      return instructions as DigitalAssetInstructions;
    } catch {
      return null;
    }
  }

  static toDomainBatch(records: WillWithRelations[]): WillAggregate[] {
    return records.map((record) => this.toDomain(record));
  }

  static toPersistenceBatch(aggregates: WillAggregate[]): Prisma.WillUncheckedCreateInput[] {
    return aggregates.map((aggregate) => this.toPersistence(aggregate));
  }
}
