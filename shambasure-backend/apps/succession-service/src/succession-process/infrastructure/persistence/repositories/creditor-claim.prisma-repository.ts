// succession-service/src/succession-process/infrastructure/persistence/repositories/creditor-claim.prisma-repository.ts
import { Injectable } from '@nestjs/common';
import { CreditorClaim } from '@prisma/client';

import { PrismaService } from '@shamba/database';

// Using direct Prisma type if Entity wrapper matches closely
// Note: If using the specific Domain Entity from earlier steps, assume mapped import:
// import { CreditorClaim } from '../../../domain/entities/creditor-claim.entity';
// import { CreditorClaimMapper } from '../mappers/creditor-claim.mapper';

// For consistency with previous mapping logic, using Mapper pattern:
import { CreditorClaim as DomainClaim } from '../../../domain/entities/creditor-claim.entity';
import { CreditorClaimRepositoryInterface } from '../../../domain/repositories/creditor-claim.repository.interface';
import { CreditorClaimMapper } from '../mappers/creditor-claim.mapper';

@Injectable()
export class CreditorClaimPrismaRepository implements CreditorClaimRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(claim: DomainClaim): Promise<void> {
    const model = CreditorClaimMapper.toPersistence(claim);

    await this.prisma.creditorClaim.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<DomainClaim | null> {
    const raw = await this.prisma.creditorClaim.findUnique({
      where: { id },
    });
    return raw ? CreditorClaimMapper.toDomain(raw) : null;
  }

  async findByEstateId(estateId: string): Promise<DomainClaim[]> {
    const raw = await this.prisma.creditorClaim.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(CreditorClaimMapper.toDomain);
  }

  async findAcceptedClaims(estateId: string): Promise<DomainClaim[]> {
    const raw = await this.prisma.creditorClaim.findMany({
      where: {
        estateId,
        status: 'ACCEPTED',
      },
    });
    return raw.map(CreditorClaimMapper.toDomain);
  }

  async findDisputedClaims(estateId: string): Promise<DomainClaim[]> {
    const raw = await this.prisma.creditorClaim.findMany({
      where: {
        estateId,
        status: 'DISPUTED', // or REJECTED/LITIGATION
      },
    });
    return raw.map(CreditorClaimMapper.toDomain);
  }
}
