import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { AdoptionOrder } from '../../../domain/entities/adoption-order.entity';
import { IAdoptionOrderRepository } from '../../../domain/interfaces/repositories/iadoption-order.repository';
import { AdoptionOrderMapper } from '../mappers/adoption-order.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class AdoptionOrderRepository implements IAdoptionOrderRepository {
  private readonly logger = new Logger(AdoptionOrderRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderMapper: AdoptionOrderMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(adoptionOrder: AdoptionOrder): Promise<AdoptionOrder> {
    try {
      const persistenceData = this.orderMapper.toPersistence(adoptionOrder);
      const savedOrder = await this.prisma.adoptionOrder.create({
        data: persistenceData,
      });
      return this.orderMapper.toDomain(savedOrder)!;
    } catch (error) {
      this.logger.error(`Failed to create adoption order ${adoptionOrder.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<AdoptionOrder | null> {
    const order = await this.prisma.adoptionOrder.findUnique({
      where: { id },
    });
    return this.orderMapper.toDomain(order);
  }

  async update(adoptionOrder: AdoptionOrder): Promise<AdoptionOrder> {
    try {
      const persistenceData = this.orderMapper.toPersistence(adoptionOrder);
      const { id, ...updateData } = persistenceData;

      const savedOrder = await this.prisma.adoptionOrder.update({
        where: { id },
        data: updateData,
      });
      return this.orderMapper.toDomain(savedOrder)!;
    } catch (error) {
      this.logger.error(`Failed to update adoption order ${adoptionOrder.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.adoptionOrder.delete({
        where: { id },
      });
      this.logger.log(`Adoption order ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete adoption order ${id}:`, error);
      throw error;
    }
  }

  // ============ LEGAL & COMPLIANCE QUERIES ============
  async findByCourtOrderNumber(orderNumber: string): Promise<AdoptionOrder | null> {
    const order = await this.prisma.adoptionOrder.findUnique({
      where: { courtOrderNumber: orderNumber },
    });
    return this.orderMapper.toDomain(order);
  }

  async existsByCourtOrderNumber(orderNumber: string): Promise<boolean> {
    const count = await this.prisma.adoptionOrder.count({
      where: { courtOrderNumber: orderNumber },
    });
    return count > 0;
  }

  async findAllByFamilyId(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: { familyId },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  // ============ PERSON-CENTRIC QUERIES ============
  async findAllByAdopteeId(adopteeId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: { adopteeId },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async findAllByAdopterId(adopterId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: { adopterId },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async findActiveAdoptionForAdoptee(adopteeId: string): Promise<AdoptionOrder | null> {
    // Find the most recent finalized adoption for this adoptee
    const order = await this.prisma.adoptionOrder.findFirst({
      where: {
        adopteeId,
        registrationDate: { not: null }, // Finalized adoptions
      },
      orderBy: { registrationDate: 'desc' },
    });
    return this.orderMapper.toDomain(order);
  }

  // ============ ADOPTION TYPE QUERIES ============
  async findAllByAdoptionType(adoptionType: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: { adoptionType },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async findStatutoryAdoptions(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        familyId,
        adoptionType: 'STATUTORY',
      },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async findCustomaryAdoptions(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        familyId,
        adoptionType: 'CUSTOMARY',
      },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  // ============ STATUS & COMPLIANCE QUERIES ============
  async findFinalizedAdoptions(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        familyId,
        registrationDate: { not: null },
      },
      orderBy: { registrationDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async findPendingAdoptions(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        familyId,
        registrationDate: null,
      },
      orderBy: { adoptionDate: 'desc' },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  // ============ BULK OPERATIONS ============
  async batchSave(adoptionOrders: AdoptionOrder[]): Promise<AdoptionOrder[]> {
    if (adoptionOrders.length === 0) {
      return [];
    }

    const savedOrders: AdoptionOrder[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const order of adoptionOrders) {
        const persistenceData = this.orderMapper.toPersistence(order);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.adoptionOrder.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedOrders.push(this.orderMapper.toDomain(saved)!);
      }
    });

    return savedOrders;
  }

  async batchDeleteByFamilyId(familyId: string): Promise<void> {
    await this.prisma.adoptionOrder.deleteMany({
      where: { familyId },
    });
    this.logger.log(`All adoption orders for family ${familyId} deleted`);
  }

  // ============ VALIDATION QUERIES ============
  async hasActiveAdoption(adopteeId: string, adopterId: string): Promise<boolean> {
    const count = await this.prisma.adoptionOrder.count({
      where: {
        adopteeId,
        adopterId,
        registrationDate: { not: null }, // Only finalized adoptions
      },
    });
    return count > 0;
  }

  async validateAdoptionUniqueness(
    familyId: string,
    adopteeId: string,
    adopterId: string,
  ): Promise<boolean> {
    // Check if there's already an adoption order for this relationship
    const existing = await this.prisma.adoptionOrder.findFirst({
      where: {
        familyId,
        adopteeId,
        adopterId,
        OR: [
          { registrationDate: null }, // Pending adoption
          { registrationDate: { not: null } }, // Or finalized adoption
        ],
      },
    });
    return existing === null; // Return true if no existing adoption
  }

  // ============ COUNT OPERATIONS ============
  async countByFamilyId(familyId: string): Promise<number> {
    return await this.prisma.adoptionOrder.count({
      where: { familyId },
    });
  }

  async countByAdoptionType(familyId: string, adoptionType: string): Promise<number> {
    return await this.prisma.adoptionOrder.count({
      where: {
        familyId,
        adoptionType,
      },
    });
  }

  async countFinalizedAdoptions(familyId: string): Promise<number> {
    return await this.prisma.adoptionOrder.count({
      where: {
        familyId,
        registrationDate: { not: null },
      },
    });
  }

  // ============ HELPER METHODS ============
  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }

  async findAdoptionsWithMissingDocuments(familyId: string): Promise<AdoptionOrder[]> {
    // Find adoptions that are missing required documents
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        familyId,
        OR: [{ childWelfareReport: null }, { suitabilityReport: null }],
      },
    });
    return this.orderMapper.toDomainBatch(orders);
  }

  async getAdoptionStatistics(familyId: string) {
    const [total, statutory, customary, finalized, pending] = await Promise.all([
      this.countByFamilyId(familyId),
      this.countByAdoptionType(familyId, 'STATUTORY'),
      this.countByAdoptionType(familyId, 'CUSTOMARY'),
      this.countFinalizedAdoptions(familyId),
      this.prisma.adoptionOrder.count({
        where: {
          familyId,
          registrationDate: null,
        },
      }),
    ]);

    return {
      total,
      statutory,
      customary,
      finalized,
      pending,
      complianceRate: total > 0 ? (finalized / total) * 100 : 0,
    };
  }
}
