import { Prisma, WillWitness as PrismaWitness } from '@prisma/client';

import {
  Witness,
  WitnessAddress,
  WitnessReconstituteProps,
} from '../../../domain/entities/witness.entity';

export class WitnessMapper {
  static toDomain(raw: PrismaWitness): Witness {
    const address = WitnessMapper.parseAddress(raw.address);

    const props: WitnessReconstituteProps = {
      id: raw.id,
      willId: raw.willId,
      userId: raw.witnessId,
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      idNumber: raw.idNumber,
      relationship: raw.relationship,
      address: address,
      status: raw.status,
      signedAt: raw.signedAt,
      signatureData: raw.signatureData,
      verifiedAt: raw.verifiedAt,
      verifiedBy: raw.verifiedBy,
      isEligible: raw.isEligible,
      ineligibilityReason: raw.ineligibilityReason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Witness.reconstitute(props);
  }

  static toPersistence(entity: Witness): Prisma.WillWitnessUncheckedCreateInput {
    const info = entity.witnessInfo;

    const addressJson = info.address
      ? (JSON.parse(JSON.stringify(info.address)) as Prisma.JsonObject)
      : Prisma.DbNull;

    return {
      id: entity.id,
      willId: entity.willId,
      witnessId: info.userId || null,
      fullName: info.fullName,
      email: info.email || null,
      phone: info.phone || null,
      idNumber: info.idNumber || null,
      relationship: info.relationship || null,
      address: addressJson,
      status: entity.status,
      signedAt: entity.signedAt,
      signatureData: entity.signatureData,
      verifiedAt: entity.verifiedAt,
      verifiedBy: entity.verifiedBy,
      isEligible: entity.isEligible,
      ineligibilityReason: entity.ineligibilityReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toUpdatePersistence(entity: Witness): Prisma.WillWitnessUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<
      Prisma.WillWitnessUncheckedCreateInput,
      'id' | 'willId' | 'witnessId' | 'fullName' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  private static parseAddress(input: Prisma.JsonValue | null): WitnessAddress | null {
    if (input === null || input === undefined) return null;
    if (typeof input !== 'object' || Array.isArray(input)) return null;

    const address = input as Record<string, unknown>;
    return {
      street: typeof address.street === 'string' ? address.street : undefined,
      city: typeof address.city === 'string' ? address.city : undefined,
      county: typeof address.county === 'string' ? address.county : undefined,
      postalCode: typeof address.postalCode === 'string' ? address.postalCode : undefined,
    };
  }

  static toDomainBatch(records: PrismaWitness[]): Witness[] {
    return records.map((record) => this.toDomain(record));
  }

  static toPersistenceBatch(entities: Witness[]): Prisma.WillWitnessUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
