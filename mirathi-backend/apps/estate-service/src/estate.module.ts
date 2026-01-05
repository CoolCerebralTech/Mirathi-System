// =============================================================================
// ESTATE MODULE - Main Application Module
// =============================================================================
import { Module } from '@nestjs/common';

// Shared Libraries
import { AuthModule } from '@shamba/auth';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// Application Services
import {
  // Assets
  AddAssetService,
  AddBeneficiaryService,
  // Debts
  AddDebtService,
  AddWitnessService,
  CalculateNetWorthService,
  // Estate
  CreateEstateService,
  // Will
  CreateWillService,
  GenerateWillPreviewService,
  GetEstateSummaryService,
  ListAssetsService,
  ListDebtsService,
  PayDebtService,
  UpdateAssetValueService,
  VerifyAssetService,
} from './application/services';
// Domain Services
import {
  KenyanSuccessionRulesService,
  NetWorthCalculatorService,
  WillPreviewGeneratorService,
  WillValidatorService,
} from './domain/services';
// Controllers
import {
  AssetsController,
  DebtsController,
  EstateController,
  WillController,
} from './presentation/controllers/estate.controller';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'estate-service',
      version: '1.0.0',
    }),
  ],
  controllers: [
    EstateController,
    AssetsController,
    DebtsController,
    WillController,
    HealthController,
  ],
  providers: [
    // === DOMAIN SERVICES (Pure Business Logic) ===
    NetWorthCalculatorService,
    KenyanSuccessionRulesService,
    WillValidatorService,
    WillPreviewGeneratorService,

    // === APPLICATION SERVICES (Use Cases) ===
    // Estate
    CreateEstateService,
    GetEstateSummaryService,
    CalculateNetWorthService,

    // Assets
    AddAssetService,
    ListAssetsService,
    UpdateAssetValueService,
    VerifyAssetService,

    // Debts
    AddDebtService,
    ListDebtsService,
    PayDebtService,

    // Will
    CreateWillService,
    AddBeneficiaryService,
    AddWitnessService,
    GenerateWillPreviewService,
  ],
  exports: [
    // Export services that other microservices might need
    GetEstateSummaryService,
    CalculateNetWorthService,
  ],
})
export class EstateModule {}
