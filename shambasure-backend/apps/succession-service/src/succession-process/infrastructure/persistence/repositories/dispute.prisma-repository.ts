// succession-service/src/succession-process/infrastructure/persistence/repositories/dispute.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DisputeStatus } from '@prisma/client';
import { DisputeRepositoryInterface } from '../../../domain/repositories/dispute.repository.interface';
import { Dispute } from '../../../domain/entities/dispute.entity';
import { DisputeMapper } from '../mappers/dispute.mapper';

@Injectable()
export class DisputePrismaRepository implements DisputeRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(dispute: Dispute): Promise<void> {
    const model = DisputeMapper.toPersistence(dispute);

    await this.prisma.dispute.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<Dispute | null> {
    const raw = await this.prisma.dispute.findUnique({
      where: { id },
    });
    return raw ? DisputeMapper.toDomain(raw) : null;
  }

  async findByWillId(willId: string): Promise<Dispute[]> {
    const raw = await this.prisma.dispute.findMany({
      where: { willId },
      orderBy: { filedAt: 'desc' },
    });
    return raw.map(DisputeMapper.toDomain);
  }

  async findByDisputantId(disputantId: string): Promise<Dispute[]> {
    const raw = await this.prisma.dispute.findMany({
      where: { disputantId },
    });
    return raw.map(DisputeMapper.toDomain);
  }

  async findActiveDisputes(willId: string): Promise<Dispute[]> {
    // Returns disputes that halt the probate process
    const raw = await this.prisma.dispute.findMany({
      where: {
        willId,
        status: {
          in: ['FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING'],
        },
      },
    });
    return raw.map(DisputeMapper.toDomain);
  }

  async findByStatus(status: DisputeStatus): Promise<Dispute[]> {
    const raw = await this.prisma.dispute.findMany({
      where: { status },
    });
    return raw.map(DisputeMapper.toDomain);
  }
}
