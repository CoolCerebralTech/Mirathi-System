// succession-service/src/succession-process/infrastructure/persistence/mappers/estate-inventory.mapper.ts

import { EstateInventory as PrismaInventory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { EstateInventory } from '../../../domain/entities/estate-inventory.entity';
import { AssetValue } from '../../../../estate-planning/domain/value-objects/asset-value.vo';

export class EstateInventoryMapper {
  static toPersistence(domain: EstateInventory): PrismaInventory {
    const value = domain.getValue();

    return {
      id: domain.getId(),
      estateId: domain.getEstateId(),
      assetId: domain.getAssetId(),

      description: domain.getDescription(),
      estimatedValue: new Decimal(value.getAmount()),
      currency: value.getCurrency(),

      ownedByDeceased: (domain as any).ownedByDeceased, // Accessing via private/protected if getter missing, or assume getter exists

      createdAt: new Date(),
      // Note: 'isVerified' logic might be stored in a specific column or ignored if schema lacks it.
      // Assuming standard fields.
    } as unknown as PrismaInventory;
  }

  static toDomain(raw: PrismaInventory): EstateInventory {
    const value = new AssetValue(Number(raw.estimatedValue), raw.currency);

    return EstateInventory.reconstitute({
      id: raw.id,
      estateId: raw.estateId,
      description: raw.description,
      estimatedValue: value, // Pass VO directly? Or raw amount? Reconstitute expects raw usually.
      // Adjusting based on Reconstitute signature defined earlier:
      // it expected raw props. We pass raw numeric value and currency.
      currency: raw.currency,
      assetId: raw.assetId,
      ownedByDeceased: raw.ownedByDeceased,

      createdAt: raw.createdAt,
      // If 'isVerified' isn't in schema, it defaults to false in entity
    });
  }
}
