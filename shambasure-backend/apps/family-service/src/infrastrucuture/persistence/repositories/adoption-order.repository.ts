import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { AdoptionOrder } from '../../../domain/entities/adoption-order.entity';
import { IAdoptionOrderRepository } from '../../../domain/interfaces/repositories/iadoption-order.repository';
import { AdoptionOrderMapper } from '../mappers/adoption-order.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class AdoptionOrderRepository implements IAdoptionOrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderMapper: AdoptionOrderMapper,
  ) {}

  async findById(id: string): Promise<AdoptionOrder | null> {
    const order = await this.prisma.adoptionOrder.findUnique({
      where: { id },
    });
    return this.orderMapper.toDomain(order);
  }

  async findByCourtOrderNumber(orderNumber: string): Promise<AdoptionOrder | null> {
    const order = await this.prisma.adoptionOrder.findUnique({
      where: { courtOrderNumber: orderNumber },
    });
    return this.orderMapper.toDomain(order);
  }

  async findAllByFamilyId(familyId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: { familyId },
    });
    return orders
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is AdoptionOrder => order !== null);
  }

  async findAllByPersonId(personId: string): Promise<AdoptionOrder[]> {
    const orders = await this.prisma.adoptionOrder.findMany({
      where: {
        OR: [{ adopteeId: personId }, { adopterId: personId }],
      },
    });
    return orders
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is AdoptionOrder => order !== null);
  }

  async save(order: AdoptionOrder, tx?: TransactionClient): Promise<AdoptionOrder> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.orderMapper.toPersistence(order);

    const { id, ...updateData } = persistenceData;

    const savedOrder = await prismaClient.adoptionOrder.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.orderMapper.toDomain(savedOrder)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.adoptionOrder.delete({
      where: { id },
    });
  }
}
