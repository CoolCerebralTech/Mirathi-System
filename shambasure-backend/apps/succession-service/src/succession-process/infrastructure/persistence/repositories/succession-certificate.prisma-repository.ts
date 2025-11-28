// succession-service/src/succession-process/infrastructure/persistence/repositories/succession-certificate.prisma-repository.ts
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { SuccessionCertificate } from '../../../domain/entities/succession-certificate.entity';
import { SuccessionCertificateRepositoryInterface } from '../../../domain/repositories/succession-certificate.repository.interface';
import { SuccessionCertificateMapper } from '../mappers/succession-certificate.mapper';

@Injectable()
export class SuccessionCertificatePrismaRepository implements SuccessionCertificateRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(certificate: SuccessionCertificate): Promise<void> {
    const model = SuccessionCertificateMapper.toPersistence(certificate);

    await this.prisma.grantOfAdministration.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<SuccessionCertificate | null> {
    const raw = await this.prisma.grantOfAdministration.findUnique({
      where: { id },
    });
    return raw ? SuccessionCertificateMapper.toDomain(raw) : null;
  }

  async findByEstateId(estateId: string): Promise<SuccessionCertificate | null> {
    const raw = await this.prisma.grantOfAdministration.findFirst({
      where: { estateId },
      orderBy: { issuedAt: 'desc' }, // Get most recent if multiple (e.g. renewal)
    });
    return raw ? SuccessionCertificateMapper.toDomain(raw) : null;
  }

  async findByApplicantId(applicantId: string): Promise<SuccessionCertificate[]> {
    const raw = await this.prisma.grantOfAdministration.findMany({
      where: { applicantId },
    });
    return raw.map(SuccessionCertificateMapper.toDomain);
  }

  async findPendingConfirmation(monthsElapsed: number): Promise<SuccessionCertificate[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsElapsed);

    const raw = await this.prisma.grantOfAdministration.findMany({
      where: {
        status: 'PENDING', // Not yet Confirmed
        issuedAt: {
          lte: cutoffDate, // Issued BEFORE 6 months ago
        },
      },
    });
    return raw.map(SuccessionCertificateMapper.toDomain);
  }
}
