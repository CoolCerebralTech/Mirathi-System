// application/guardianship/ports/inbound/guardianship.use-case.ts
import { Result } from '../../../common/result';
// Command Payloads
import { AddCoGuardianCommandPayload } from '../../commands/impl/add-co-guardian.command';
import { CheckBondExpiryCommandPayload } from '../../commands/impl/check-bond-expiry.command';
import { CheckComplianceCommandPayload } from '../../commands/impl/check-compliance.command';
import { CreateGuardianshipCommandPayload } from '../../commands/impl/create-guardianship.command';
import { DissolveGuardianshipCommandPayload } from '../../commands/impl/dissolve-guardianship.command';
import { FileAnnualReportCommandPayload } from '../../commands/impl/file-annual-report.command';
import { GrantPropertyPowersCommandPayload } from '../../commands/impl/grant-property-powers.command';
import { PostGuardianBondCommandPayload } from '../../commands/impl/post-guardian-bond.command';
import { RecordWardCapacityRestoredCommandPayload } from '../../commands/impl/record-ward-capacity-restored.command';
import { RecordWardDeathCommandPayload } from '../../commands/impl/record-ward-death.command';
import { RemoveGuardianCommandPayload } from '../../commands/impl/remove-guardian.command';
import { RenewGuardianBondCommandPayload } from '../../commands/impl/renew-guardian-bond.command';
import { ReplaceGuardianCommandPayload } from '../../commands/impl/replace-guardian.command';
import { UpdateGuardianAllowanceCommandPayload } from '../../commands/impl/update-guardian-allowance.command';
import { UpdateGuardianRestrictionsCommandPayload } from '../../commands/impl/update-guardian-restrictions.command';
import { UpdateWardInfoCommandPayload } from '../../commands/impl/update-ward-info.command';
// Query Filters & Read Models
import { ReportStatusFilters } from '../../queries/impl/get-annual-report-status.query';
import { BondExpiryFilters } from '../../queries/impl/get-bond-expiry-dashboard.query';
import { AnnualReportStatusReadModel } from '../../queries/read-models/annual-report-status.read-model';
import { BondExpiryReadModel } from '../../queries/read-models/bond-expiry.read-model';
import { ComplianceStatusReadModel } from '../../queries/read-models/compliance-status.read-model';
import { CustomaryGuardianshipReadModel } from '../../queries/read-models/customary-guardianship.read-model';
import { GuardianAssignmentReadModel } from '../../queries/read-models/guardian-assignment.read-model';
import { GuardianshipDetailsReadModel } from '../../queries/read-models/guardianship-details.read-model';
import { GuardianshipSummaryReadModel } from '../../queries/read-models/guardianship-summary.read-model';

/**
 * Metadata for context propagation (UserInfo, Tracing)
 */
export interface AppContext {
  userId: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * Guardianship Use Case / Inbound Port
 *
 * Defines the application's API surface.
 * Controllers invoke these methods, oblivious to CQRS/EventSourcing internals.
 */
export abstract class GuardianshipUseCase {
  // ===========================================================================
  // COMMANDS (Write)
  // ===========================================================================
  abstract createGuardianship(
    payload: CreateGuardianshipCommandPayload,
    ctx: AppContext,
  ): Promise<string>;

  abstract addCoGuardian(payload: AddCoGuardianCommandPayload, ctx: AppContext): Promise<void>;

  abstract replaceGuardian(payload: ReplaceGuardianCommandPayload, ctx: AppContext): Promise<void>;

  abstract removeGuardian(payload: RemoveGuardianCommandPayload, ctx: AppContext): Promise<void>;

  abstract dissolveGuardianship(
    payload: DissolveGuardianshipCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  // --- Bond Management ---
  abstract postGuardianBond(
    payload: PostGuardianBondCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract renewGuardianBond(
    payload: RenewGuardianBondCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract checkBondExpiry(payload: CheckBondExpiryCommandPayload, ctx: AppContext): Promise<void>;

  // --- Powers & Reporting ---
  abstract grantPropertyPowers(
    payload: GrantPropertyPowersCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract updateRestrictions(
    payload: UpdateGuardianRestrictionsCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract updateAllowance(
    payload: UpdateGuardianAllowanceCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract fileAnnualReport(
    payload: FileAnnualReportCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  abstract checkCompliance(payload: CheckComplianceCommandPayload, ctx: AppContext): Promise<void>;

  // --- Ward Lifecycle ---
  abstract updateWardInfo(payload: UpdateWardInfoCommandPayload, ctx: AppContext): Promise<void>;

  abstract recordWardDeath(payload: RecordWardDeathCommandPayload, ctx: AppContext): Promise<void>;

  abstract recordWardCapacityRestored(
    payload: RecordWardCapacityRestoredCommandPayload,
    ctx: AppContext,
  ): Promise<void>;

  // ===========================================================================
  // QUERIES (Read)
  // ===========================================================================
  abstract getGuardianshipById(
    id: string,
    ctx: AppContext,
  ): Promise<Result<GuardianshipDetailsReadModel>>;

  abstract getGuardianshipSummary(
    id: string,
    ctx: AppContext,
  ): Promise<Result<GuardianshipSummaryReadModel>>;

  abstract getWardGuardianships(
    wardId: string,
    includeDissolved: boolean,
    ctx: AppContext,
  ): Promise<Result<GuardianshipSummaryReadModel[]>>;

  abstract getGuardianActiveAssignments(
    guardianId: string,
    ctx: AppContext,
  ): Promise<Result<GuardianAssignmentReadModel[]>>;

  abstract getComplianceStatus(
    id: string,
    ctx: AppContext,
  ): Promise<Result<ComplianceStatusReadModel>>;

  abstract getBondExpiryDashboard(
    filters: BondExpiryFilters,
    ctx: AppContext,
  ): Promise<Result<BondExpiryReadModel[]>>;

  abstract getAnnualReportStatus(
    id: string,
    filters: ReportStatusFilters | undefined,
    ctx: AppContext,
  ): Promise<Result<AnnualReportStatusReadModel>>;

  abstract getCustomaryGuardianshipDetails(
    id: string,
    ctx: AppContext,
  ): Promise<Result<CustomaryGuardianshipReadModel>>;
}
