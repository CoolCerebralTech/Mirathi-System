import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyLegalEvent } from '../../../domain/entities/family-legal-event.entity';
import { IFamilyLegalEventRepository } from '../../../domain/interfaces/repositories/ifamily-legal-event.repository';
import { FamilyLegalEventMapper } from '../mappers/family-legal-event.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyLegalEventRepository implements IFamilyLegalEventRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventMapper: FamilyLegalEventMapper,
  ) {}

  async findById(id: string): Promise<FamilyLegalEvent | null> {
    const event = await this.prisma.familyLegalEvent.findUnique({
      where: { id },
    });
    return this.eventMapper.toDomain(event);
  }

  async findAllByFamilyId(familyId: string): Promise<FamilyLegalEvent[]> {
    const events = await this.prisma.familyLegalEvent.findMany({
      where: { familyId },
      orderBy: {
        createdAt: 'desc', // Show the most recent events first
      },
    });

    return events
      .map((event) => this.eventMapper.toDomain(event))
      .filter((event): event is FamilyLegalEvent => event !== null);
  }

  async save(event: FamilyLegalEvent, tx?: TransactionClient): Promise<FamilyLegalEvent> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.eventMapper.toPersistence(event);

    // Legal events are immutable and append-only. We always create, never update.
    const savedEvent = await prismaClient.familyLegalEvent.create({
      data: persistenceData,
    });

    return this.eventMapper.toDomain(savedEvent)!;
  }
}
