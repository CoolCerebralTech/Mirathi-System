// estate-planning/application/estate-planning-application.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EstatePlanningPersistenceModule } from '../infrastructure/persistence/estate-planning-persistence.module';
import { WillValidationService } from '../domain/services/will-validation.service';
import { EstateCalculationService } from '../domain/services/estate-calculation.service';
import { DependantsProvisionPolicy } from '../domain/policies/dependants-provision.policy';
import { WitnessEligibilityPolicy } from '../domain/policies/witness-eligibility.policy';
import { ExecutorEligibilityPolicy } from '../domain/policies/executor-eligibility.policy';
import { AssetVerificationPolicy } from '../domain/policies/asset-verification.policy';
import { WillService } from './services/will.service';
import { AssetService } from './services/asset.service';
import { BeneficiaryService } from './services/beneficiary.service';
import { ExecutorService } from './services/executor.service';
import { WitnessService } from './services/witness.service';

// Import all commands and queries
import { CreateWillCommand } from './commands/create-will.command';
import { UpdateWillCommand } from './commands/update-will.command';
import { AddAssetCommand } from './commands/add-asset.command';
import { RemoveAssetCommand } from './commands/remove-asset.command';
import { AssignBeneficiaryCommand } from './commands/assign-beneficiary.command';
import { UpdateBeneficiaryCommand } from './commands/update-beneficiary.command';
import { NominateExecutorCommand } from './commands/nominate-executor.command';
import { AddWitnessCommand } from './commands/add-witness.command';
import { SignWillCommand } from './commands/sign-will.command';
import { ActivateWillCommand } from './commands/activate-will.command';
import { RevokeWillCommand } from './commands/revoke-will.command';

@Module({
  imports: [CqrsModule, EstatePlanningPersistenceModule],
  providers: [
    // Domain Services
    WillValidationService,
    EstateCalculationService,

    // Domain Policies
    DependantsProvisionPolicy,
    WitnessEligibilityPolicy,
    ExecutorEligibilityPolicy,
    AssetVerificationPolicy,

    // Application Services
    WillService,
    AssetService,
    BeneficiaryService,
    ExecutorService,
    WitnessService,

    // Commands (for CQRS)
    CreateWillCommand,
    UpdateWillCommand,
    AddAssetCommand,
    RemoveAssetCommand,
    AssignBeneficiaryCommand,
    UpdateBeneficiaryCommand,
    NominateExecutorCommand,
    AddWitnessCommand,
    SignWillCommand,
    ActivateWillCommand,
    RevokeWillCommand,
  ],
  exports: [WillService, AssetService, BeneficiaryService, ExecutorService, WitnessService],
})
export class EstatePlanningApplicationModule {}
