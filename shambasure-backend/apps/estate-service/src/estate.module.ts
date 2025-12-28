import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// --- SHARED LIBS ---
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

// =============================================================================
// 2. HANDLERS: ESTATE AGGREGATE (Commands)
// =============================================================================
// Assets
import {
  AddAssetCoOwnerHandler,
  AddAssetHandler,
  EncumberAssetHandler,
  UpdateAssetValueHandler,
} from './application/estate/commands/handlers/assets';
// Debts
import {
  AddDebtHandler,
  DisputeDebtHandler,
  ExecuteS45WaterfallHandler,
  PayDebtHandler,
  ResolveDebtDisputeHandler,
  WriteOffDebtHandler,
} from './application/estate/commands/handlers/debt';
// Dependants
import {
  RejectDependantClaimHandler,
  SettleDependantClaimHandler,
  VerifyDependantClaimHandler,
} from './application/estate/commands/handlers/dependants/adjudicate-claim.handler';
import { FileDependantClaimHandler } from './application/estate/commands/handlers/dependants/file-dependant-claim.handler';
import {
  AddDependantEvidenceHandler,
  VerifyDependantEvidenceHandler,
} from './application/estate/commands/handlers/dependants/manage-evidence.handler';
// Gifts
import {
  ContestGiftHandler,
  ResolveGiftDisputeHandler,
} from './application/estate/commands/handlers/gifts/manage-gift-dispute.handler';
import { RecordGiftInterVivosHandler } from './application/estate/commands/handlers/gifts/record-gift-inter-vivos.handler';
// Lifecycle
import {
  CloseEstateHandler,
  CreateEstateHandler,
  FreezeEstateHandler,
  UnfreezeEstateHandler,
} from './application/estate/commands/handlers/lifecycle/lifecycle.handlers';
// Liquidation
import {
  ApproveLiquidationHandler,
  CancelLiquidationHandler,
  InitiateLiquidationHandler,
  ReceiveLiquidationProceedsHandler,
  RecordLiquidationSaleHandler,
  SubmitLiquidationForApprovalHandler,
} from './application/estate/commands/handlers/liquidation/liquidation-process.handler';
// Tax
import { ApplyForTaxExemptionHandler } from './application/estate/commands/handlers/tax/apply-for-tax-exemption.handler';
import { RecordTaxAssessmentHandler } from './application/estate/commands/handlers/tax/record-tax-assessment.handler';
import { RecordTaxPaymentHandler } from './application/estate/commands/handlers/tax/record-tax-payment.handler';
import { UploadClearanceCertificateHandler } from './application/estate/commands/handlers/tax/upload-clearance-certificate.handler';
import { GetEstateAssetsHandler } from './application/estate/queries/handlers/assets/get-assets.handler';
import { GetEstateDebtsHandler } from './application/estate/queries/handlers/debt/get-estate-debts.handler';
import { GetEstateDependantsHandler } from './application/estate/queries/handlers/dependants/get-estate-dependants.handler';
import { GetEstateDashboardHandler } from './application/estate/queries/handlers/estate/get-estate-dashboard.handler';
// =============================================================================
// 3. HANDLERS: ESTATE AGGREGATE (Queries)
// =============================================================================
import { CheckSolvencyHandler } from './application/estate/queries/handlers/financials/solvency.handler';
import { GetGiftsInterVivosHandler } from './application/estate/queries/handlers/gifts/get-gifts-inter-vivos.handler';
import { GetDistributionReadinessHandler } from './application/estate/queries/handlers/reports/distribution-readiness.handler';
// =============================================================================
// 1. HANDLERS: WILL AGGREGATE
// =============================================================================
import {
  AddBeneficiaryHandler,
  AddCodicilHandler,
  AddWitnessHandler,
  AppointExecutorHandler,
  CreateDraftWillHandler,
  ExecuteWillHandler,
  RecordDisinheritanceHandler,
  RecordWitnessSignatureHandler,
  RevokeWillHandler,
  UpdateCapacityDeclarationHandler,
} from './application/will/commands/handlers';
import {
  GetActiveWillHandler,
  GetExecutorAssignmentsHandler,
  GetTestatorHistoryHandler,
  GetWillByIdHandler,
  GetWillComplianceReportHandler,
  SearchWillsHandler,
} from './application/will/queries/handlers';
// =============================================================================
// CONSTANTS & TOKENS
// =============================================================================
import { ESTATE_REPOSITORY } from './domain/interfaces/estate.repository.interface';
import { WILL_REPOSITORY } from './domain/interfaces/will.repository.interface';
// =============================================================================
// INFRASTRUCTURE (Repositories)
// =============================================================================
import { PrismaEstateRepository } from './infrastructure/persistence/repositories/prisma-estate.repository';
import { PrismaWillRepository } from './infrastructure/persistence/repositories/prisma-will.repository';
// =============================================================================
// CONTROLLERS
// =============================================================================
import { EstateCommandController } from './presentation/estate/controllers/estate.command.controller';
import { EstateQueryController } from './presentation/estate/controllers/estate.query.controller';
import { HealthController } from './presentation/health/health.controller';
import { WillCommandController } from './presentation/will/controllers/will.command.controller';
import { WillQueryController } from './presentation/will/controllers/will.query.controller';

// --- HANDLER ARRAYS ---

const WillCommandHandlers = [
  CreateDraftWillHandler,
  AddBeneficiaryHandler,
  AppointExecutorHandler,
  RecordDisinheritanceHandler,
  UpdateCapacityDeclarationHandler,
  AddWitnessHandler,
  ExecuteWillHandler,
  RecordWitnessSignatureHandler,
  AddCodicilHandler,
  RevokeWillHandler,
];

const WillQueryHandlers = [
  GetActiveWillHandler,
  GetTestatorHistoryHandler,
  GetWillByIdHandler,
  GetWillComplianceReportHandler,
  SearchWillsHandler,
  GetExecutorAssignmentsHandler,
];

const EstateCommandHandlers = [
  // Assets
  AddAssetHandler,
  EncumberAssetHandler,
  AddAssetCoOwnerHandler,
  UpdateAssetValueHandler,
  // Debt
  AddDebtHandler,
  DisputeDebtHandler,
  ExecuteS45WaterfallHandler,
  PayDebtHandler,
  ResolveDebtDisputeHandler,
  WriteOffDebtHandler,
  // Dependants
  FileDependantClaimHandler,
  VerifyDependantClaimHandler,
  RejectDependantClaimHandler,
  SettleDependantClaimHandler,
  AddDependantEvidenceHandler,
  VerifyDependantEvidenceHandler,
  // Gifts
  ContestGiftHandler,
  ResolveGiftDisputeHandler,
  RecordGiftInterVivosHandler,
  // Lifecycle
  CreateEstateHandler,
  FreezeEstateHandler,
  UnfreezeEstateHandler,
  CloseEstateHandler,
  // Liquidation
  InitiateLiquidationHandler,
  SubmitLiquidationForApprovalHandler,
  ApproveLiquidationHandler,
  RecordLiquidationSaleHandler,
  ReceiveLiquidationProceedsHandler,
  CancelLiquidationHandler,
  // Tax
  ApplyForTaxExemptionHandler,
  RecordTaxAssessmentHandler,
  RecordTaxPaymentHandler,
  UploadClearanceCertificateHandler,
];

const EstateQueryHandlers = [
  GetEstateAssetsHandler,
  GetEstateDebtsHandler,
  GetEstateDependantsHandler,
  GetEstateDashboardHandler,
  CheckSolvencyHandler,
  GetGiftsInterVivosHandler,
  GetDistributionReadinessHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    SharedAuthModule,
    MessagingModule.register({}),
    ObservabilityModule.register({ serviceName: 'estate-service', version: '1.0.0' }),
    NotificationModule,
  ],
  controllers: [
    HealthController,
    // Will Controllers
    WillCommandController,
    WillQueryController,
    // Estate Controllers
    EstateCommandController,
    EstateQueryController,
  ],
  providers: [
    // Repositories
    PrismaWillRepository,
    PrismaEstateRepository,

    // Handlers
    ...WillCommandHandlers,
    ...WillQueryHandlers,
    ...EstateCommandHandlers,
    ...EstateQueryHandlers,

    // Bindings
    {
      provide: WILL_REPOSITORY,
      useExisting: PrismaWillRepository,
    },
    {
      provide: ESTATE_REPOSITORY,
      useExisting: PrismaEstateRepository,
    },
  ],
  exports: [WILL_REPOSITORY, ESTATE_REPOSITORY],
})
export class EstateModule {}
