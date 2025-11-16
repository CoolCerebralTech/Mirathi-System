// common/shared.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import {
  courtFeesConfig,
  legalRulesConfig,
  featureFlagsConfig,
  type SuccessionConfig,
} from './config';

// Decorators

// Guards
import { TestatorOwnershipGuard } from './guards/ownership.guard';
import { WillStatusGuard } from './guards/will-status.guard';
import { KenyanLawValidationGuard } from './guards/legal-compliance.guard';
import { FamilyMemberAccessGuard } from './guards/family-member-access.guard';
import { ProbateCourtRoleGuard } from './guards/roles.guard';

// Pipes
import { KenyanIdValidationPipe } from './pipes/kenyan-id-validation.pipe';
import { AssetValuationPipe } from './pipes/asset-valuation.pipe';
import { SharePercentagePipe } from './pipes/share-percentage.pipe';
import { FamilyRelationshipPipe } from './pipes/family-relationship.pipe';
import { KenyanPhonePipe } from './pipes/kenyan-phone.pipe';

// Interceptors
import { KenyanLawComplianceInterceptor } from './interceptors/kenyan-law-compliance.interceptor';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';
import { ResponseMappingInterceptor } from './interceptors/response-mapping.interceptor';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';

// Filters
import { KenyanLawViolationFilter } from './filters/kenyan-law-violation.filter';
import { BusinessRuleViolationFilter } from './filters/business-rule-violation.filter';
import { ValidationErrorFilter } from './filters/validation-error.filter';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

// Utils
import { KenyanSuccessionCalculator } from './utils/kenyan-succession-calculator';
import { LegalFormalityChecker } from './utils/legal-formality-checker';
import { ProbateProcessor } from './utils/probate-processor';
import { FamilyTreeBuilder } from './utils/family-tree-builder';
import { AssetValuationHelper } from './utils/asset-valuation-helper';
// Constants
import {
  LAW_OF_SUCCESSION_SECTIONS,
  KENYAN_LEGAL_REQUIREMENTS,
  KENYAN_FAMILY_LAW,
  KENYAN_ASSET_CLASSIFICATION,
  SUCCESSION_TIMEFRAMES,
  KENYAN_COURTS,
} from './constants/kenyan-law.constants';

import {
  ASSET_OWNERSHIP_RULES,
  BENEFICIARY_RULES,
  EXECUTOR_RULES,
  WITNESS_RULES,
  DISPUTE_RULES,
  DISTRIBUTION_RULES,
  BUSINESS_RULES,
} from './constants/succession-rules.constants';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [SuccessionConfig, legalRulesConfig, courtFeesConfig, featureFlagsConfig],
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [
    // Guards
    TestatorOwnershipGuard,
    WillStatusGuard,
    KenyanLawValidationGuard,
    FamilyMemberAccessGuard,
    ProbateCourtRoleGuard,

    // Pipes
    KenyanIdValidationPipe,
    AssetValuationPipe,
    SharePercentagePipe,
    FamilyRelationshipPipe,
    KenyanPhonePipe,

    // Interceptors
    KenyanLawComplianceInterceptor,
    AuditLoggingInterceptor,
    ResponseMappingInterceptor,
    ErrorHandlingInterceptor,

    // Filters
    KenyanLawViolationFilter,
    BusinessRuleViolationFilter,
    ValidationErrorFilter,
    GlobalExceptionFilter,

    // Utils
    KenyanSuccessionCalculator,
    LegalFormalityChecker,
    ProbateProcessor,
    FamilyTreeBuilder,
    AssetValuationHelper,

    // Constants (as value providers for injection)
    {
      provide: 'KENYAN_LAW_CONSTANTS',
      useValue: {
        LAW_OF_SUCCESSION_SECTIONS,
        KENYAN_LEGAL_REQUIREMENTS,
        KENYAN_FAMILY_LAW,
        KENYAN_ASSET_CLASSIFICATION,
        SUCCESSION_TIMEFRAMES,
        KENYAN_COURTS,
      },
    },
    {
      provide: 'SUCCESSION_RULES_CONSTANTS',
      useValue: {
        ASSET_OWNERSHIP_RULES,
        BENEFICIARY_RULES,
        EXECUTOR_RULES,
        WITNESS_RULES,
        DISPUTE_RULES,
        DISTRIBUTION_RULES,
        BUSINESS_RULES,
      },
    },
  ],
  exports: [
    // Guards
    TestatorOwnershipGuard,
    WillStatusGuard,
    KenyanLawValidationGuard,
    FamilyMemberAccessGuard,
    ProbateCourtRoleGuard,

    // Pipes
    KenyanIdValidationPipe,
    AssetValuationPipe,
    SharePercentagePipe,
    FamilyRelationshipPipe,
    KenyanPhonePipe,

    // Interceptors
    KenyanLawComplianceInterceptor,
    AuditLoggingInterceptor,
    ResponseMappingInterceptor,
    ErrorHandlingInterceptor,

    // Filters
    KenyanLawViolationFilter,
    BusinessRuleViolationFilter,
    ValidationErrorFilter,
    GlobalExceptionFilter,

    // Utils
    KenyanSuccessionCalculator,
    LegalFormalityChecker,
    ProbateProcessor,
    FamilyTreeBuilder,
    AssetValuationHelper,

    // Constants
    'KENYAN_LAW_CONSTANTS',
    'SUCCESSION_RULES_CONSTANTS',
  ],
})
export class SharedModule {}

export * from './decorators';
export * from './guards';
export * from './pipes';
export * from './interceptors';
export * from './filters';
export * from './utils';
export * from './constants';
export * from './types';
export * from './config';
