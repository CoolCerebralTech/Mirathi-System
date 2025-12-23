// application/guardianship/services/guardianship-application.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Result } from '../../common/base/result';
// Commands
import {
  AddCoGuardianCommand,
  AddCoGuardianCommandPayload,
} from '../commands/impl/add-co-guardian.command';
import {
  CheckBondExpiryCommand,
  CheckBondExpiryCommandPayload,
} from '../commands/impl/check-bond-expiry.command';
import {
  CheckComplianceCommand,
  CheckComplianceCommandPayload,
} from '../commands/impl/check-compliance.command';
import {
  CreateGuardianshipCommand,
  CreateGuardianshipCommandPayload,
} from '../commands/impl/create-guardianship.command';
import {
  DissolveGuardianshipCommand,
  DissolveGuardianshipCommandPayload,
} from '../commands/impl/dissolve-guardianship.command';
import {
  FileAnnualReportCommand,
  FileAnnualReportCommandPayload,
} from '../commands/impl/file-annual-report.command';
import {
  GrantPropertyPowersCommand,
  GrantPropertyPowersCommandPayload,
} from '../commands/impl/grant-property-powers.command';
import {
  PostGuardianBondCommand,
  PostGuardianBondCommandPayload,
} from '../commands/impl/post-guardian-bond.command';
import {
  RecordWardCapacityRestoredCommand,
  RecordWardCapacityRestoredCommandPayload,
} from '../commands/impl/record-ward-capacity-restored.command';
import {
  RecordWardDeathCommand,
  RecordWardDeathCommandPayload,
} from '../commands/impl/record-ward-death.command';
import {
  RemoveGuardianCommand,
  RemoveGuardianCommandPayload,
} from '../commands/impl/remove-guardian.command';
import {
  RenewGuardianBondCommand,
  RenewGuardianBondCommandPayload,
} from '../commands/impl/renew-guardian-bond.command';
import {
  ReplaceGuardianCommand,
  ReplaceGuardianCommandPayload,
} from '../commands/impl/replace-guardian.command';
import {
  UpdateGuardianAllowanceCommand,
  UpdateGuardianAllowanceCommandPayload,
} from '../commands/impl/update-guardian-allowance.command';
import {
  UpdateGuardianRestrictionsCommand,
  UpdateGuardianRestrictionsCommandPayload,
} from '../commands/impl/update-guardian-restrictions.command';
import {
  UpdateWardInfoCommand,
  UpdateWardInfoCommandPayload,
} from '../commands/impl/update-ward-info.command';
// Port
import { AppContext, GuardianshipUseCase } from '../ports/inbound/guardianship.use-case';
// Queries
import {
  GetAnnualReportStatusQuery,
  ReportStatusFilters,
} from '../queries/impl/get-annual-report-status.query';
import {
  BondExpiryFilters,
  GetBondExpiryDashboardQuery,
} from '../queries/impl/get-bond-expiry-dashboard.query';
import { GetComplianceStatusQuery } from '../queries/impl/get-compliance-status.query';
import { GetCustomaryGuardianshipDetailsQuery } from '../queries/impl/get-customary-guardianship-details.query';
import { GetGuardianActiveAssignmentsQuery } from '../queries/impl/get-guardian-active-assignments.query';
import { GetGuardianshipByIdQuery } from '../queries/impl/get-guardianship-by-id.query';
import { GetGuardianshipSummaryQuery } from '../queries/impl/get-guardianship-summary.query';
import { GetWardGuardianshipsQuery } from '../queries/impl/get-ward-guardianships.query';
// Read Models
import { AnnualReportStatusReadModel } from '../queries/read-models/annual-report-status.read-model';
import { BondExpiryReadModel } from '../queries/read-models/bond-expiry.read-model';
import { ComplianceStatusReadModel } from '../queries/read-models/compliance-status.read-model';
import { CustomaryGuardianshipReadModel } from '../queries/read-models/customary-guardianship.read-model';
import { GuardianAssignmentReadModel } from '../queries/read-models/guardian-assignment.read-model';
import { GuardianshipDetailsReadModel } from '../queries/read-models/guardianship-details.read-model';
import { GuardianshipSummaryReadModel } from '../queries/read-models/guardianship-summary.read-model';

@Injectable()
export class GuardianshipApplicationService implements GuardianshipUseCase {
  private readonly logger = new Logger(GuardianshipApplicationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ===========================================================================
  // COMMANDS
  // ===========================================================================

  async createGuardianship(
    payload: CreateGuardianshipCommandPayload,
    ctx: AppContext,
  ): Promise<string> {
    return this.commandBus.execute(new CreateGuardianshipCommand(payload, ctx));
  }

  async addCoGuardian(payload: AddCoGuardianCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new AddCoGuardianCommand(payload, ctx));
  }

  async replaceGuardian(payload: ReplaceGuardianCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new ReplaceGuardianCommand(payload, ctx));
  }

  async removeGuardian(payload: RemoveGuardianCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new RemoveGuardianCommand(payload, ctx));
  }

  async dissolveGuardianship(
    payload: DissolveGuardianshipCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new DissolveGuardianshipCommand(payload, ctx));
  }

  // --- Bond Management ---

  async postGuardianBond(payload: PostGuardianBondCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new PostGuardianBondCommand(payload, ctx));
  }

  async renewGuardianBond(
    payload: RenewGuardianBondCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new RenewGuardianBondCommand(payload, ctx));
  }

  async checkBondExpiry(payload: CheckBondExpiryCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new CheckBondExpiryCommand(payload, ctx));
  }

  // --- Powers & Reporting ---

  async grantPropertyPowers(
    payload: GrantPropertyPowersCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new GrantPropertyPowersCommand(payload, ctx));
  }

  async updateRestrictions(
    payload: UpdateGuardianRestrictionsCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateGuardianRestrictionsCommand(payload, ctx));
  }

  async updateAllowance(
    payload: UpdateGuardianAllowanceCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateGuardianAllowanceCommand(payload, ctx));
  }

  async fileAnnualReport(payload: FileAnnualReportCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new FileAnnualReportCommand(payload, ctx));
  }

  async checkCompliance(payload: CheckComplianceCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new CheckComplianceCommand(payload, ctx));
  }

  // --- Ward Lifecycle ---

  async updateWardInfo(payload: UpdateWardInfoCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new UpdateWardInfoCommand(payload, ctx));
  }

  async recordWardDeath(payload: RecordWardDeathCommandPayload, ctx: AppContext): Promise<void> {
    return this.commandBus.execute(new RecordWardDeathCommand(payload, ctx));
  }

  async recordWardCapacityRestored(
    payload: RecordWardCapacityRestoredCommandPayload,
    ctx: AppContext,
  ): Promise<void> {
    return this.commandBus.execute(new RecordWardCapacityRestoredCommand(payload, ctx));
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  async getGuardianshipById(
    id: string,
    ctx: AppContext,
  ): Promise<Result<GuardianshipDetailsReadModel>> {
    return this.queryBus.execute(new GetGuardianshipByIdQuery(id, ctx));
  }

  async getGuardianshipSummary(
    id: string,
    ctx: AppContext,
  ): Promise<Result<GuardianshipSummaryReadModel>> {
    return this.queryBus.execute(new GetGuardianshipSummaryQuery(id, ctx));
  }

  async getWardGuardianships(
    wardId: string,
    includeDissolved: boolean,
    ctx: AppContext,
  ): Promise<Result<GuardianshipSummaryReadModel[]>> {
    return this.queryBus.execute(new GetWardGuardianshipsQuery({ wardId, includeDissolved }, ctx));
  }

  async getGuardianActiveAssignments(
    guardianId: string,
    ctx: AppContext,
  ): Promise<Result<GuardianAssignmentReadModel[]>> {
    return this.queryBus.execute(new GetGuardianActiveAssignmentsQuery(guardianId, ctx));
  }

  async getComplianceStatus(
    id: string,
    ctx: AppContext,
  ): Promise<Result<ComplianceStatusReadModel>> {
    return this.queryBus.execute(new GetComplianceStatusQuery(id, ctx));
  }

  async getBondExpiryDashboard(
    filters: BondExpiryFilters,
    ctx: AppContext,
  ): Promise<Result<BondExpiryReadModel[]>> {
    return this.queryBus.execute(new GetBondExpiryDashboardQuery(filters, ctx));
  }

  async getAnnualReportStatus(
    id: string,
    filters: ReportStatusFilters | undefined,
    ctx: AppContext,
  ): Promise<Result<AnnualReportStatusReadModel>> {
    return this.queryBus.execute(
      new GetAnnualReportStatusQuery({ guardianshipId: id, filters }, ctx),
    );
  }

  async getCustomaryGuardianshipDetails(
    id: string,
    ctx: AppContext,
  ): Promise<Result<CustomaryGuardianshipReadModel>> {
    return this.queryBus.execute(new GetCustomaryGuardianshipDetailsQuery(id, ctx));
  }
}
