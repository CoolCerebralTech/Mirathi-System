// succession-service/src/succession-process/infrastructure/persistence/repositories/court-hearing.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { CourtHearingRepositoryInterface } from '../../../domain/repositories/court-hearing.repository.interface';
import { CourtHearing } from '../../../domain/entities/court-hearing.entity';
import { CourtHearingMapper } from '../mappers/court-hearing.mapper';

@Injectable()
export class CourtHearingPrismaRepository implements CourtHearingRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(hearing: CourtHearing): Promise<void> {
    const model = CourtHearingMapper.toPersistence(hearing);

    await this.prisma.courtHearing.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<CourtHearing | null> {
    const raw = await this.prisma.courtHearing.findUnique({
      where: { id },
    });
    return raw ? CourtHearingMapper.toDomain(raw) : null;
  }

  async findByCaseId(caseId: string): Promise<CourtHearing[]> {
    const raw = await this.prisma.courtHearing.findMany({
      where: { estateId: caseId }, // Mapping caseId -> estateId
      orderBy: { date: 'asc' },
    });
    return raw.map(CourtHearingMapper.toDomain);
  }

  async findUpcomingByEstateId(estateId: string): Promise<CourtHearing[]> {
    const raw = await this.prisma.courtHearing.findMany({
      where: {
        estateId,
        date: { gte: new Date() }, // Future dates
        status: 'SCHEDULED',
      },
      orderBy: { date: 'asc' },
    });
    return raw.map(CourtHearingMapper.toDomain);
  }

  async findUpcomingReminders(date: Date): Promise<CourtHearing[]> {
    // Find hearings specifically on this date (e.g., for "Tomorrow's Hearings" email)
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const raw = await this.prisma.courtHearing.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        status: 'SCHEDULED',
      },
    });
    return raw.map(CourtHearingMapper.toDomain);
  }
}
