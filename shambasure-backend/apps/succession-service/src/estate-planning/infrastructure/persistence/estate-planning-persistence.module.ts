// estate-planning/infrastructure/persistence/estate-planning-persistence.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WitnessRepositoryInterface } from '../../domain/interfaces/witness.repository.interface';
import { WillPrismaRepository } from './repositories/will.prisma-repository';
import { AssetPrismaRepository } from './repositories/asset.prisma-repository';
import { BeneficiaryPrismaRepository } from './repositories/beneficiary.prisma-repository';
import { ExecutorPrismaRepository } from './repositories/executor.prisma-repository';
import { WitnessPrismaRepository } from './repositories/witness.prisma-repository';

@Module({
  providers: [
    PrismaService,
    {
      provide: WillRepositoryInterface,
      useClass: WillPrismaRepository,
    },
    {
      provide: AssetRepositoryInterface,
      useClass: AssetPrismaRepository,
    },
    {
      provide: BeneficiaryRepositoryInterface,
      useClass: BeneficiaryPrismaRepository,
    },
    {
      provide: ExecutorRepositoryInterface,
      useClass: ExecutorPrismaRepository,
    },
    {
      provide: WitnessRepositoryInterface,
      useClass: WitnessPrismaRepository,
    },
  ],
  exports: [
    WillRepositoryInterface,
    AssetRepositoryInterface,
    BeneficiaryRepositoryInterface,
    ExecutorRepositoryInterface,
    WitnessRepositoryInterface,
  ],
})
export class EstatePlanningPersistenceModule {}
