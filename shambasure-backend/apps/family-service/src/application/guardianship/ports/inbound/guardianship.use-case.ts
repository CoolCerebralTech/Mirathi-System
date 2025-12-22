// application/guardianship/ports/inbound/guardianship.use-case.ts
import { PaginatedResponse } from '../../../common/dto/pagination.dto';
import { CreateGuardianshipRequest } from '../../dto/request/create-guardianship.request';
import { FileAnnualReportRequest } from '../../dto/request/file-annual-report.request';
import { FindGuardianshipsQuery } from '../../dto/request/find-guardianships.query';
import { GrantPropertyPowersRequest } from '../../dto/request/grant-property-powers.request';
import { PostBondRequest } from '../../dto/request/post-bond.request';
import { TerminateGuardianshipRequest } from '../../dto/request/terminate-guardianship.request';
import { UpdateAllowanceRequest } from '../../dto/request/update-allowance.request';
import { ComplianceReportResponse } from '../../dto/response/compliance-report.response';
import { GuardianshipSummaryResponse } from '../../dto/response/guardianship-summary.response';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';

export interface IGuardianshipUseCase {
  /**
   * Core Guardianship Management
   */
  createGuardianship(
    request: CreateGuardianshipRequest,
    userId: string,
  ): Promise<GuardianshipResponse>;

  getGuardianshipById(id: string): Promise<GuardianshipResponse>;

  updateGuardianship(
    id: string,
    updates: Partial<CreateGuardianshipRequest>,
  ): Promise<GuardianshipResponse>;

  /**
   * Kenyan Law Compliance Operations (S.70-73 LSA)
   */
  postBond(guardianshipId: string, request: PostBondRequest): Promise<GuardianshipResponse>;

  fileAnnualReport(
    guardianshipId: string,
    request: FileAnnualReportRequest,
  ): Promise<GuardianshipResponse>;

  grantPropertyManagementPowers(
    guardianshipId: string,
    request: GrantPropertyPowersRequest,
  ): Promise<GuardianshipResponse>;

  updateAnnualAllowance(
    guardianshipId: string,
    request: UpdateAllowanceRequest,
  ): Promise<GuardianshipResponse>;

  approveAnnualReport(guardianshipId: string, auditorId: string): Promise<GuardianshipResponse>;

  /**
   * Lifecycle Management
   */
  terminateGuardianship(
    guardianshipId: string,
    request: TerminateGuardianshipRequest,
  ): Promise<GuardianshipResponse>;

  extendGuardianshipTerm(
    guardianshipId: string,
    newValidUntil: Date,
    courtOrderNumber?: string,
  ): Promise<GuardianshipResponse>;

  renewBond(
    guardianshipId: string,
    newExpiryDate: Date,
    provider?: string,
    policyNumber?: string,
  ): Promise<GuardianshipResponse>;

  /**
   * Query Operations
   */
  findGuardianships(
    query: FindGuardianshipsQuery,
  ): Promise<PaginatedResponse<GuardianshipSummaryResponse>>;

  findGuardianshipsByWardId(wardId: string, activeOnly?: boolean): Promise<GuardianshipResponse[]>;

  findGuardianshipsByGuardianId(
    guardianId: string,
    activeOnly?: boolean,
  ): Promise<GuardianshipResponse[]>;

  /**
   * Compliance & Monitoring
   */
  checkCompliance(guardianshipId: string): Promise<{
    s72Compliant: boolean;
    s73Compliant: boolean;
    overallCompliant: boolean;
    issues: string[];
  }>;

  getComplianceReport(): Promise<ComplianceReportResponse>;

  findOverdueGuardianships(): Promise<GuardianshipSummaryResponse[]>;

  findExpiringBonds(daysThreshold: number): Promise<GuardianshipSummaryResponse[]>;

  findDueReports(daysThreshold: number): Promise<GuardianshipSummaryResponse[]>;

  /**
   * Bulk Operations
   */
  markOverdueReports(): Promise<{ marked: number }>;

  sendComplianceNotifications(): Promise<{ sent: number }>;

  /**
   * Validation & Verification
   */
  validateGuardianshipEligibility(
    wardId: string,
    guardianId: string,
  ): Promise<{ eligible: boolean; reasons: string[] }>;

  verifyCourtOrder(courtOrderNumber: string): Promise<{ valid: boolean; details: any }>;
}
