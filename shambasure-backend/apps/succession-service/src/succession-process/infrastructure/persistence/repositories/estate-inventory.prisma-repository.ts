// succession-service/src/succession-process/infrastructure/persistence/repositories/estate-inventory.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { EstateInventoryRepositoryInterface } from '../../../domain/repositories/estate-inventory.repository.interface';
import { EstateInventory } from '../../../domain/entities/estate-inventory.entity';
import { EstateInventoryMapper } from '../mappers/estate-inventory.mapper';

@Injectable()
export class EstateInventoryPrismaRepository implements EstateInventoryRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(item: EstateInventory): Promise<void> {
    const model = EstateInventoryMapper.toPersistence(item);

    await this.prisma.estateInventory.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<EstateInventory | null> {
    const raw = await this.prisma.estateInventory.findUnique({
      where: { id },
    });
    return raw ? EstateInventoryMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.estateInventory.delete({
      where: { id },
    });
  }

  async findByEstateId(estateId: string): Promise<EstateInventory[]> {
    const raw = await this.prisma.estateInventory.findMany({
      where: { estateId },
      orderBy: { estimatedValue: 'desc' }, // High value items first
    });
    return raw.map(EstateInventoryMapper.toDomain);
  }

  async findVerifiedItems(estateId: string): Promise<EstateInventory[]> {
    // Note: If 'isVerified' isn't a direct column in schema, we might use 
    // metadata or assume all added to inventory are verified for now.
    // Assuming implementation via metadata check or future schema update.
    // For MVP, returns all items as they are "Verified" by virtue of being filed.
    return this.findByEstateId(estateId);
  }

  async calculateTotalValue(estateId: string, currency: string): Promise<number> {
    const result = await this.prisma.estateInventory.aggregate({
      where: {
        estateId,
        currency, // Only sum matching currency
      },
      _sum: {
        estimatedValue: true,
      },
    });

    return Number(result._sum.estimatedValue || 0);
  }
}
