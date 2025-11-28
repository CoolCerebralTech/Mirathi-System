import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// --- Controllers (Presentation Layer) ---
import { FamilyController } from './presentation/controllers/family.controller';
import { FamilyMemberController } from './presentation/controllers/family-member.controller';
import { MarriageController } from './presentation/controllers/marriage.controller';
import { RelationshipController } from './presentation/controllers/relationship.controller';
import { GuardianshipController } from './presentation/controllers/guardianship.controller';
import { CustomaryLawController } from './presentation/controllers/customary-law.controller';

// --- Application Services ---
import { FamilyService } from './application/services/family.service';
import { FamilyMemberService } from './application/services/family-member.service';
import { MarriageService } from './application/services/marriage.service';
import { RelationshipService } from './application/services/relationship.service';
import { GuardianshipService } from './application/services/guardianship.service';
import { CustomaryLawService } from './application/services/customary-law.service';

// --- Domain Services ---
import { FamilyTreeBuilderService } from './domain/services/family-tree-builder.service';
import { RelationshipIntegrityService } from './domain/services/relationship-integrity.service';
import { DependantCalculatorService } from './domain/services/dependant-calculator.service';

// --- Domain Policies ---
import { CustomaryMarriagePolicy } from './domain/policies/customary-marriage.policy';
import { DependantIdentificationPolicy } from './domain/policies/dependant-identification.policy';
import { FamilyTreeIntegrityPolicy } from './domain/policies/family-tree-integrity.policy';
import { GuardianEligibilityPolicy } from './domain/policies/guardian-eligibility.policy';
import { PolygamousFamilyPolicy } from './domain/policies/polygamous-family.policy';
import { RelationshipValidationPolicy } from './domain/policies/relationship-validation.policy';

// --- Infrastructure (Repositories) ---
import { FamilyPrismaRepository } from './infrastructure/persistence/repositories/family.prisma-repository';
import { FamilyMemberPrismaRepository } from './infrastructure/persistence/repositories/family-member.prisma-repository';
import { MarriagePrismaRepository } from './infrastructure/persistence/repositories/marriage.prisma-repository';
import { RelationshipPrismaRepository } from './infrastructure/persistence/repositories/relationship.prisma-repository';
import { GuardianshipPrismaRepository } from './infrastructure/persistence/repositories/guardianship.prisma-repository';

// --- Command Handlers ---
import { CreateFamilyHandler } from './application/commands/create-family.command';
import { UpdateFamilyHandler } from './application/commands/update-family.command';
import { AddFamilyMemberHandler } from './application/commands/add-family-member.command';
import { UpdateFamilyMemberHandler } from './application/commands/update-family-member.command';
import { RemoveFamilyMemberHandler } from './application/commands/remove-family-member.command';
import { CreateMarriageHandler } from './application/commands/create-marriage.command';
import { UpdateMarriageHandler } from './application/commands/update-marriage.command';
import { DissolveMarriageHandler } from './application/commands/dissolve-marriage.command';
import { CreateRelationshipHandler } from './application/commands/create-relationship.command';
import { VerifyRelationshipHandler } from './application/commands/verify-relationship.command';
import { RemoveRelationshipHandler } from './application/commands/remove-relationship.command';
import { AssignGuardianHandler } from './application/commands/assign-guardian.command';
import { RemoveGuardianHandler } from './application/commands/remove-guardian.command';
import { RefreshTreeVisualizationHandler } from './application/commands/refresh-tree-visualization.command';

// --- Query Handlers ---
import { GetFamilyHandler } from './application/queries/get-family.query';
import { ListFamiliesHandler } from './application/queries/list-families.query';
import { GetFamilyTreeHandler } from './application/queries/get-family-tree.query';
import { GetFamilyMembersHandler } from './application/queries/get-family-members.query';
import { GetFamilyMemberHandler } from './application/queries/get-family-member.query';
import { FindPotentialHeirsHandler } from './application/queries/find-potential-heirs.query';
import { GetMarriagesHandler } from './application/queries/get-marriages.query';
import { GetMemberMarriagesHandler } from './application/queries/get-member-marriages.query';
import { GetRelationshipsHandler } from './application/queries/get-relationships.query';
import { GetChildrenHandler } from './application/queries/get-children.query';
import { GetGuardianshipsHandler } from './application/queries/get-guardianships.query';
import { GetDependantsHandler } from './application/queries/get-dependants.query';

// Grouping for cleaner providers array
const CommandHandlers = [
  CreateFamilyHandler,
  UpdateFamilyHandler,
  AddFamilyMemberHandler,
  UpdateFamilyMemberHandler,
  RemoveFamilyMemberHandler,
  CreateMarriageHandler,
  UpdateMarriageHandler,
  DissolveMarriageHandler,
  CreateRelationshipHandler,
  VerifyRelationshipHandler,
  RemoveRelationshipHandler,
  AssignGuardianHandler,
  RemoveGuardianHandler,
  RefreshTreeVisualizationHandler,
];

const QueryHandlers = [
  GetFamilyHandler,
  ListFamiliesHandler,
  GetFamilyTreeHandler,
  GetFamilyMembersHandler,
  GetFamilyMemberHandler,
  FindPotentialHeirsHandler,
  GetMarriagesHandler,
  GetMemberMarriagesHandler,
  GetRelationshipsHandler,
  GetChildrenHandler,
  GetGuardianshipsHandler,
  GetDependantsHandler,
];

const DomainServices = [
  FamilyTreeBuilderService,
  RelationshipIntegrityService,
  DependantCalculatorService,
  // Policies
  CustomaryMarriagePolicy,
  DependantIdentificationPolicy,
  FamilyTreeIntegrityPolicy,
  GuardianEligibilityPolicy,
  PolygamousFamilyPolicy,
  RelationshipValidationPolicy,
];

const ApplicationServices = [
  FamilyService,
  FamilyMemberService,
  MarriageService,
  RelationshipService,
  GuardianshipService,
  CustomaryLawService,
];

// Dependency Injection Bindings
const InfrastructureRepositories = [
  { provide: 'FamilyRepositoryInterface', useClass: FamilyPrismaRepository },
  { provide: 'FamilyMemberRepositoryInterface', useClass: FamilyMemberPrismaRepository },
  { provide: 'MarriageRepositoryInterface', useClass: MarriagePrismaRepository },
  { provide: 'RelationshipRepositoryInterface', useClass: RelationshipPrismaRepository },
  { provide: 'GuardianshipRepositoryInterface', useClass: GuardianshipPrismaRepository },
];

@Module({
  imports: [CqrsModule, ConfigModule],
  controllers: [
    FamilyController,
    FamilyMemberController,
    MarriageController,
    RelationshipController,
    GuardianshipController,
    CustomaryLawController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...DomainServices,
    ...ApplicationServices,
    ...InfrastructureRepositories,
  ],
  exports: [
    FamilyService,
    FamilyMemberService, // Exported so Estate Planning can query dependants
    CustomaryLawService,
  ],
})
export class FamilyTreeModule {}
