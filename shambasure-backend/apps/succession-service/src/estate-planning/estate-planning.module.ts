import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// --- Controllers ---
import { AssetController } from './presentation/controllers/asset.controller';
import { BeneficiaryController } from './presentation/controllers/beneficiary.controller';
import { DebtController } from './presentation/controllers/debt.controller';
import { ExecutorController } from './presentation/controllers/executor.controller';
import { WillController } from './presentation/controllers/will.controller';
import { WitnessController } from './presentation/controllers/witness.controller';

// --- Application Services ---
import { AssetService } from './application/services/asset.service';
import { BeneficiaryService } from './application/services/beneficiary.service';
import { DebtService } from './application/services/debt.service';
import { ExecutorService } from './application/services/executor.service';
import { WillService } from './application/services/will.service';
import { WitnessService } from './application/services/witness.service';

// --- Domain Services & Policies ---
import { EstateCalculationService } from './domain/services/estate-calculation.service';
import { WillValidationService } from './domain/services/will-validation.service';
import { AssetVerificationPolicy } from './domain/policies/asset-verification.policy';
import { DependantsProvisionPolicy } from './domain/policies/dependants-provision.policy';
import { ExecutorEligibilityPolicy } from './domain/policies/executor-eligibility.policy';
import { WillStructurePolicy } from './domain/policies/will-structure.policy';
import { WitnessEligibilityPolicy } from './domain/policies/witness-eligibility.policy';

// --- Infrastructure (Repositories) ---
import { AssetPrismaRepository } from './infrastructure/persistence/repositories/asset.prisma-repository';
import { BeneficiaryPrismaRepository } from './infrastructure/persistence/repositories/beneficiary.prisma-repository';
import { DebtPrismaRepository } from './infrastructure/persistence/repositories/debt.prisma-repository';
import { ExecutorPrismaRepository } from './infrastructure/persistence/repositories/executor.prisma-repository';
import { WillPrismaRepository } from './infrastructure/persistence/repositories/will.prisma-repository';
import { WitnessPrismaRepository } from './infrastructure/persistence/repositories/witness.prisma-repository';

// --- Command Handlers ---
import { AddAssetHandler } from './application/commands/add-asset.command';
import { UpdateAssetHandler } from './application/commands/update-asset.command';
import { RemoveAssetHandler } from './application/commands/remove-asset.command';

import { AssignBeneficiaryHandler } from './application/commands/assign-beneficiary.command';
import { UpdateBeneficiaryHandler } from './application/commands/update-beneficiary.command';
import { RemoveBeneficiaryHandler } from './application/commands/remove-beneficiary.command';

import { AddDebtHandler } from './application/commands/add-debt.command';
import { RecordDebtPaymentHandler } from './application/commands/record-debt-payment.command';

import { NominateExecutorHandler } from './application/commands/nominate-executor.command';
import { RemoveExecutorHandler } from './application/commands/remove-executor.command';

import { CreateWillHandler } from './application/commands/create-will.command';
import { UpdateWillHandler } from './application/commands/update-will.command';
import { ActivateWillHandler } from './application/commands/activate-will.command';
import { RevokeWillHandler } from './application/commands/revoke-will.command';
import { SignWillHandler } from './application/commands/sign-will.command';

import { AddWitnessHandler } from './application/commands/add-witness.command';
import { RemoveWitnessHandler } from './application/commands/remove-witness.command';
import { InviteWitnessHandler } from './application/commands/invite-witness.command';

// --- Query Handlers ---
import { GetEstateAssetsHandler } from './application/queries/get-estate-assets.query';
import { GetAssetHandler } from './application/queries/get-asset.query';
import { GetPortfolioValueHandler } from './application/queries/get-portfolio-value.query';

import { GetBeneficiariesHandler } from './application/queries/get-beneficiaries.query';
import { GetBeneficiaryHandler } from './application/queries/get-beneficiary.query';
import { GetAssetDistributionHandler } from './application/queries/get-asset-distribution.query';

import { GetDebtsHandler } from './application/queries/get-debts.query';
import { GetDebtHandler } from './application/queries/get-debt.query';
import { GetLiabilitiesSummaryHandler } from './application/queries/get-liabilities-summary.query';

import { GetExecutorsHandler } from './application/queries/get-executors.query';
import { GetExecutorHandler } from './application/queries/get-executor.query';
import { GetMyNominationsHandler } from './application/queries/get-my-nominations.query';

import { GetWillHandler } from './application/queries/get-will.query';
import { ListWillsHandler } from './application/queries/list-wills.query';
import { GetWillCompletenessHandler } from './application/queries/get-will-completeness.query';
import { GetWillVersionsHandler } from './application/queries/get-will-versions.query';

import { GetWitnessesHandler } from './application/queries/get-witnesses.query';
import { GetWitnessHandler } from './application/queries/get-witness.query';

// Define grouping arrays for cleaner module registration
const CommandHandlers = [
  AddAssetHandler,
  UpdateAssetHandler,
  RemoveAssetHandler,
  AssignBeneficiaryHandler,
  UpdateBeneficiaryHandler,
  RemoveBeneficiaryHandler,
  AddDebtHandler,
  RecordDebtPaymentHandler,
  NominateExecutorHandler,
  RemoveExecutorHandler,
  CreateWillHandler,
  UpdateWillHandler,
  ActivateWillHandler,
  RevokeWillHandler,
  SignWillHandler,
  AddWitnessHandler,
  RemoveWitnessHandler,
  InviteWitnessHandler,
];

const QueryHandlers = [
  GetEstateAssetsHandler,
  GetAssetHandler,
  GetPortfolioValueHandler,
  GetBeneficiariesHandler,
  GetBeneficiaryHandler,
  GetAssetDistributionHandler,
  GetDebtsHandler,
  GetDebtHandler,
  GetLiabilitiesSummaryHandler,
  GetExecutorsHandler,
  GetExecutorHandler,
  GetMyNominationsHandler,
  GetWillHandler,
  ListWillsHandler,
  GetWillCompletenessHandler,
  GetWillVersionsHandler,
  GetWitnessesHandler,
  GetWitnessHandler,
];

const DomainServices = [
  EstateCalculationService,
  WillValidationService,
  // Policies
  AssetVerificationPolicy,
  DependantsProvisionPolicy,
  ExecutorEligibilityPolicy,
  WillStructurePolicy,
  WitnessEligibilityPolicy,
];

const ApplicationServices = [
  AssetService,
  BeneficiaryService,
  DebtService,
  ExecutorService,
  WillService,
  WitnessService,
];

// Bind Interfaces to Implementations
const InfrastructureRepositories = [
  { provide: 'AssetRepositoryInterface', useClass: AssetPrismaRepository },
  { provide: 'BeneficiaryRepositoryInterface', useClass: BeneficiaryPrismaRepository },
  { provide: 'DebtRepositoryInterface', useClass: DebtPrismaRepository },
  { provide: 'ExecutorRepositoryInterface', useClass: ExecutorPrismaRepository },
  { provide: 'WillRepositoryInterface', useClass: WillPrismaRepository },
  { provide: 'WitnessRepositoryInterface', useClass: WitnessPrismaRepository },
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule, // Needed for courtFeesConfig injection
  ],
  controllers: [
    AssetController,
    BeneficiaryController,
    DebtController,
    ExecutorController,
    WillController,
    WitnessController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...DomainServices,
    ...ApplicationServices,
    ...InfrastructureRepositories,
  ],
  exports: [
    ...ApplicationServices, // Export services if other modules need them (e.g. Probate module needs WillService)
  ],
})
export class EstatePlanningModule {}
