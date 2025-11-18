// estate-planning/estate-planning.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EstatePlanningApplicationModule } from './application/estate-planning-application.module';
import { WillController } from './presentation/controllers/will.controller';
import { AssetController } from './presentation/controllers/asset.controller';
import { BeneficiaryController } from './presentation/controllers/beneficiary.controller';
import { ExecutorController } from './presentation/controllers/executor.controller';
import { WitnessController } from './presentation/controllers/witness.controller';

@Module({
  imports: [CqrsModule, EstatePlanningApplicationModule],
  controllers: [
    WillController,
    AssetController,
    BeneficiaryController,
    ExecutorController,
    WitnessController,
  ],
  providers: [],
  exports: [],
})
export class EstatePlanningModule {}
