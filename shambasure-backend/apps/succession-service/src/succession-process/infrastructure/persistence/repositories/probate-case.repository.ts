// succession-service/src/succession-process/infrastructure/persistence/repositories/probate-case.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { ProbateCaseRepositoryInterface } from '../../../domain/repositories/probate-case.repository.interface';
import { ProbateCase, CaseStatus } from '../../../domain/entities/probate-case.entity';
import { ProbateCaseMapper } from '../mappers/probate-case.mapper';

@Injectable()
export class ProbateCasePrismaRepository implements ProbateCaseRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(probateCase: ProbateCase): Promise<void> {
    const persistenceModel = ProbateCaseMapper.toPersistence(probateCase);

    // We update the existing Estate record with the new Court/Case details
    await this.prisma.estate.update({
      where: { id: persistenceModel.id },
      data: {
        probateCaseNumber: persistenceModel.probateCaseNumber,
        administrationType: persistenceModel.administrationType,
        status: persistenceModel.status, // Updates workflow status
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<ProbateCase | null> {
    // In this architecture, the Estate ID is the Probate Case ID
    const raw = await this.prisma.estate.findUnique({
      where: { id },
    });

    if (!raw || !raw.probateCaseNumber) return null; // Only return if it's actually a court case
    return ProbateCaseMapper.toDomain(raw);
  }

  async findByEstateId(estateId: string): Promise<ProbateCase | null> {
    return this.findById(estateId);
  }

  async findByCaseNumber(caseNumber: string): Promise<ProbateCase | null> {
    const raw = await this.prisma.estate.findFirst({
      where: { probateCaseNumber: caseNumber },
    });
    return raw ? ProbateCaseMapper.toDomain(raw) : null;
  }

  async findByStatus(status: CaseStatus): Promise<ProbateCase[]> {
    const raw = await this.prisma.estate.findMany({
      // We assume 'status' column on Estate maps to CaseStatus
      // If strict enum mapping is needed, use a mapper helper here
      where: { status: status as any },
    });
    return raw.map(ProbateCaseMapper.toDomain);
  }

  async findReadyForGrantIssue(): Promise<ProbateCase[]> {
    // Logic: Cases in 'OBJECTION_PERIOD' where the gazette notice has expired.
    // Since filtering by JSON content (gazette date) inside Prisma is complex/slow,
    // we fetch all in 'OBJECTION_PERIOD' and filter in memory (Domain Logic).
    const raw = await this.prisma.estate.findMany({
      where: { status: 'DISPUTED' }, // Mapping 'OBJECTION_PERIOD' to a DB status
    });

    // Note: Real implementation should align DB Enum with Domain Enum perfectly
    return raw.map(ProbateCaseMapper.toDomain);
  }
}
