import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// --- SHARED LIBS ---
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

// --- HANDLERS (Family) ---
import { AddFamilyMemberHandler } from './application/family/commands/handlers/add-family-member.handler';
import { ArchiveFamilyHandler } from './application/family/commands/handlers/archive-family.handler';
import { CreateFamilyHandler } from './application/family/commands/handlers/create-family.handler';
import { DefineRelationshipHandler } from './application/family/commands/handlers/define-relationship.handler';
import { EstablishPolygamousHouseHandler } from './application/family/commands/handlers/establish-polygamous-house.handler';
import { RecordAdoptionHandler } from './application/family/commands/handlers/record-adoption.handler';
import { RecordCohabitationHandler } from './application/family/commands/handlers/record-cohabitation.handler';
import { RegisterMarriageHandler } from './application/family/commands/handlers/register-marriage.handler';
import { VerifyMemberIdentityHandler } from './application/family/commands/handlers/verify-member-identity.handler';
import { GetFamilyDashboardHandler } from './application/family/queries/handlers/get-family-dashboard.handler';
import { GetFamilyGraphHandler } from './application/family/queries/handlers/get-family-graph.handler';
import { GetFamilyMemberHandler } from './application/family/queries/handlers/get-family-member.handler';
import { GetPolygamyDistributionHandler } from './application/family/queries/handlers/get-polygamy-distribution.handler';
import { GetSuccessionReadinessHandler } from './application/family/queries/handlers/get-succession-readiness.handler';
import { SearchFamiliesHandler } from './application/family/queries/handlers/search-families.handler';
// --- HANDLERS (Guardianship) ---
import {
  ActivateGuardianshipHandler,
  AppointGuardianHandler,
  AutoGenerateReportSectionHandler,
  CreateGuardianshipHandler,
  PostBondHandler,
  ReactivateGuardianHandler,
  RecordConflictOfInterestHandler,
  RequestReportAmendmentHandler,
  ResolveConflictOfInterestHandler,
  ReviewComplianceReportHandler,
  SubmitComplianceReportHandler,
  SuspendGuardianHandler,
  TerminateGuardianshipHandler,
  UpdateGuardianPowersHandler,
} from './application/guardianship/commands/handlers';
import {
  GetCourtDocumentPreviewHandler,
  GetGuardianshipByIdHandler,
  GetGuardianshipRiskReportHandler,
  GetWardComplianceHistoryHandler,
  SearchGuardianshipsHandler,
} from './application/guardianship/queries/handlers';
// --- CONSTANTS & TOKENS ---
import { FAMILY_REPOSITORY } from './domain/interfaces/ifamily.repository';
import { GUARDIANSHIP_REPOSITORY } from './domain/interfaces/iguardianship.repository';
// --- INFRASTRUCTURE (Repositories) ---
import { PrismaFamilyRepository } from './infrastrucuture/persistence/repositories/prisma-family.repository';
import { PrismaGuardianshipRepository } from './infrastrucuture/persistence/repositories/prisma-guardianship.repository';
// Family Controllers
import { FamilyCommandController } from './presentation/family/controllers/family.command.controller';
import { FamilyQueryController } from './presentation/family/controllers/family.query.controller';
// Guardianship Controllers
import { GuardianshipCommandController } from './presentation/guardianship/controllers/guardianship.command.controller';
import { GuardianshipQueryController } from './presentation/guardianship/controllers/guardianship.query.controller';
// --- CONTROLLERS ---
import { HealthController } from './presentation/health/health.controller';

// Grouping for readability
const FamilyCommandHandlers = [
  CreateFamilyHandler,
  AddFamilyMemberHandler,
  RegisterMarriageHandler,
  EstablishPolygamousHouseHandler,
  DefineRelationshipHandler,
  RecordCohabitationHandler,
  RecordAdoptionHandler,
  VerifyMemberIdentityHandler,
  ArchiveFamilyHandler,
];

const FamilyQueryHandlers = [
  GetFamilyDashboardHandler,
  GetFamilyGraphHandler,
  GetFamilyMemberHandler,
  GetPolygamyDistributionHandler,
  GetSuccessionReadinessHandler,
  SearchFamiliesHandler,
];

const GuardianshipCommandHandlers = [
  ActivateGuardianshipHandler,
  AppointGuardianHandler,
  RecordConflictOfInterestHandler,
  ReactivateGuardianHandler,
  SuspendGuardianHandler,
  ResolveConflictOfInterestHandler,
  UpdateGuardianPowersHandler,
  AutoGenerateReportSectionHandler,
  CreateGuardianshipHandler,
  PostBondHandler,
  SubmitComplianceReportHandler,
  ReviewComplianceReportHandler,
  RequestReportAmendmentHandler,
  TerminateGuardianshipHandler,
];

const GuardianshipQueryHandlers = [
  GetCourtDocumentPreviewHandler,
  GetGuardianshipByIdHandler,
  GetGuardianshipRiskReportHandler,
  SearchGuardianshipsHandler,
  GetWardComplianceHistoryHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    SharedAuthModule,
    MessagingModule.register({}),
    ObservabilityModule.register({ serviceName: 'family-service', version: '1.0.0' }),
    NotificationModule,
  ],
  controllers: [
    HealthController,
    FamilyCommandController,
    FamilyQueryController,
    GuardianshipCommandController,
    GuardianshipQueryController,
  ],
  providers: [
    // Repositories (Concrete)
    PrismaFamilyRepository,
    PrismaGuardianshipRepository,

    // CQRS Handlers
    ...FamilyCommandHandlers,
    ...FamilyQueryHandlers,
    ...GuardianshipCommandHandlers,
    ...GuardianshipQueryHandlers,

    // Interface Bindings (Dependency Injection)
    {
      provide: FAMILY_REPOSITORY,
      useExisting: PrismaFamilyRepository,
    },
    {
      provide: GUARDIANSHIP_REPOSITORY,
      useExisting: PrismaGuardianshipRepository,
    },
  ],
  exports: [FAMILY_REPOSITORY, GUARDIANSHIP_REPOSITORY],
})
export class FamilyModule {}
