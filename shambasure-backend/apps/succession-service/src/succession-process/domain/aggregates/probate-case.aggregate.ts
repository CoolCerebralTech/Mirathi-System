import { AggregateRoot } from '@nestjs/cqrs';
import { DisputeType, GrantType } from '@prisma/client';
import { AssetValue } from 'apps/succession-service/src/estate-planning/domain/value-objects/asset-value.vo';

import { ExecutorDutyType, HearingType, ShareType } from '../../../common/types/kenyan-law.types';
import { CourtHearing } from '../entities/court-hearing.entity';
import { Dispute } from '../entities/dispute.entity';
import { BeneficiaryType, Distribution, TransferMethod } from '../entities/distribution.entity';
import { AssetCategory, EstateInventory, OwnershipType } from '../entities/estate-inventory.entity';
import { ExecutorDuty } from '../entities/executor-duties.entity';
import { ProbateCase } from '../entities/probate-case.entity';
import { SuccessionCertificate } from '../entities/succession-certificate.entity';
import { CaseClosedEvent } from '../events/case-closed.event';
import { GrantIssuedEvent } from '../events/grant-issued.event';
import { ObjectionFiledEvent } from '../events/objection-filed.event';
import { ProbateCaseFiledEvent } from '../events/probate-case-filed.event';

export class ProbateCaseAggregate extends AggregateRoot {
  private probateCase: ProbateCase;
  private certificate: SuccessionCertificate | null;

  // Collections
  private hearings: Map<string, CourtHearing> = new Map();
  private disputes: Map<string, Dispute> = new Map();
  private executorDuties: Map<string, ExecutorDuty> = new Map();
  private inventory: Map<string, EstateInventory> = new Map();
  private distributions: Map<string, Distribution> = new Map();

  private constructor(probateCase: ProbateCase) {
    super();
    this.probateCase = probateCase;
    this.certificate = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY & RECONSTITUTION
  // --------------------------------------------------------------------------

  static create(probateCase: ProbateCase): ProbateCaseAggregate {
    return new ProbateCaseAggregate(probateCase);
  }

  static reconstitute(
    probateCase: ProbateCase,
    certificate: SuccessionCertificate | null,
    hearings: CourtHearing[],
    disputes: Dispute[],
    executorDuties: ExecutorDuty[],
    inventory: EstateInventory[],
    distributions: Distribution[],
  ): ProbateCaseAggregate {
    const agg = new ProbateCaseAggregate(probateCase);
    agg.certificate = certificate;

    hearings.forEach((h) => agg.hearings.set(h.getId(), h));
    disputes.forEach((d) => agg.disputes.set(d.getId(), d));
    executorDuties.forEach((d) => agg.executorDuties.set(d.getId(), d));
    inventory.forEach((i) => agg.inventory.set(i.getId(), i));
    distributions.forEach((d) => agg.distributions.set(d.getId(), d));

    return agg;
  }

  // --------------------------------------------------------------------------
  // CASE INITIATION & FILING
  // --------------------------------------------------------------------------

  /**
   * Officially files the probate case with the court
   */
  fileCase(caseNumber: string, filingFee: number, filedBy: string): void {
    if (this.probateCase.getStatus() !== 'DRAFT_FILING') {
      throw new Error('Case can only be filed from DRAFT_FILING status.');
    }

    this.probateCase.fileCase(caseNumber, filingFee, filedBy);

    // Apply event for case filing
    this.apply(
      new ProbateCaseFiledEvent(
        this.probateCase.getId(),
        this.probateCase.getEstateId(),
        caseNumber,
        this.probateCase.getCourt().getStation(),
        new Date(),
        this.probateCase.getApplicationType().getValue(),
        this.probateCase.getApplicantDetails().applicantName || 'Unknown',
        filingFee,
      ),
    );
  }

  /**
   * Publishes gazette notice and starts objection period
   */
  publishGazetteNotice(
    noticeNumber: string,
    publicationDate: Date,
    gazetteIssueNumber: string,
  ): void {
    if (this.probateCase.getStatus() !== 'FILED') {
      throw new Error('Case must be filed before gazettement.');
    }

    this.probateCase.publishGazetteNotice(noticeNumber, publicationDate, gazetteIssueNumber);
  }

  // --------------------------------------------------------------------------
  // COURT WORKFLOW & HEARING MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Schedules a court hearing with comprehensive details
   */
  scheduleHearing(
    hearingId: string,
    date: Date,
    type: HearingType,
    options?: {
      virtualLink?: string;
      courtroom?: string;
      judgeName?: string;
      causeListNumber?: string;
      estimatedDuration?: number;
    },
  ): void {
    if (this.probateCase.getStatus() === 'CLOSED' || this.probateCase.getStatus() === 'WITHDRAWN') {
      throw new Error('Cannot schedule hearings for a closed or withdrawn case.');
    }

    const hearing = CourtHearing.schedule(
      hearingId,
      this.probateCase.getId(),
      date,
      type,
      this.probateCase.getCourt().getStation(),
      {
        virtualLink: options?.virtualLink,
        courtroom: options?.courtroom,
        judgeName: options?.judgeName,
        causeListNumber: options?.causeListNumber,
        startTime: '09:00', // Default, can be made configurable
        endTime: '10:00',
      },
    );

    this.hearings.set(hearingId, hearing);

    // Update case status based on hearing type
    if (type === 'CONFIRMATION_OF_GRANT') {
      this.probateCase.scheduleConfirmationHearing(hearingId, date);
    } else if (type === 'OBJECTION_HEARING') {
      this.probateCase.scheduleHearing(hearingId, date, type);
    }
  }

  /**
   * Concludes a hearing with outcome and updates case status accordingly
   */
  concludeHearing(
    hearingId: string,
    outcome: string,
    presidedBy: string,
    orders: string[] = [],
  ): void {
    const hearing = this.hearings.get(hearingId);
    if (!hearing) {
      throw new Error('Hearing not found.');
    }

    const hearingOutcome = {
      orders,
      rulings: [outcome],
      nextSteps: this.determineNextSteps(hearing.getType(), outcome),
    };

    hearing.complete(hearingOutcome, presidedBy, true, orders.length > 0);

    // Update case status based on hearing outcome
    this.updateCaseStatusAfterHearing(hearing.getType(), outcome);
  }

  /**
   * Adjourns a hearing to a later date
   */
  adjournHearing(hearingId: string, reason: string, nextDate: Date, presidedBy: string): void {
    const hearing = this.hearings.get(hearingId);
    if (!hearing) {
      throw new Error('Hearing not found.');
    }

    hearing.adjourn(reason, nextDate, presidedBy);

    // Reschedule the hearing in the system
    this.scheduleHearing(`adjourned-${hearingId}-${Date.now()}`, nextDate, hearing.getType(), {
      virtualLink: hearing.getVirtualLink() ?? undefined,
      courtroom: hearing.getCourtroom() ?? undefined,
      judgeName: hearing.getJudgeName() ?? undefined,
    });
  }

  // --------------------------------------------------------------------------
  // DISPUTE & OBJECTION MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Files a formal objection/dispute against the grant
   */
  fileObjection(
    disputeId: string,
    disputantId: string,
    type: any, // DisputeType from prisma
    description: string,
    grounds: string[],
    options?: {
      lawyerName?: string;
      lawyerContact?: string;
      supportingEvidence?: string[];
    },
  ): void {
    if (!this.isObjectionPeriodActive()) {
      throw new Error('Objection period has expired or not started.');
    }

    const dispute = Dispute.create(
      disputeId,
      this.probateCase.getId(),
      disputantId,
      type as DisputeType, // ✅ cast to the correct type
      description,
      options?.supportingEvidence || [],
    );

    if (options?.lawyerName) {
      dispute.assignLawyer(options.lawyerName, options.lawyerContact || '');
    }

    this.disputes.set(disputeId, dispute);
    this.probateCase.recordObjection(disputeId, disputantId, grounds);

    this.apply(
      new ObjectionFiledEvent(
        this.probateCase.getId(),
        this.probateCase.getEstateId(),
        disputeId,
        disputantId,
        grounds,
        new Date(),
      ),
    );
  }

  /**
   * Resolves a dispute and updates case status
   */
  resolveDispute(
    disputeId: string,
    outcome: string,
    resolvedBy: string,
    isDismissed: boolean = false,
  ): void {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found.');

    dispute.resolve(outcome, isDismissed, resolvedBy);

    if (this.areAllDisputesResolved()) {
      // Logic to revert case status if needed, e.g. back to OBJECTION_PERIOD or GRANT_ISSUED readiness
    }
  }

  /**
   * Starts mediation for a dispute
   */
  startMediation(
    disputeId: string,
    mediatorName: string,
    mediationDate: Date,
    location: string,
    startedBy: string,
  ): void {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found.');
    }

    dispute.startMediation(mediatorName, mediationDate, location, startedBy);
  }

  // --------------------------------------------------------------------------
  // GRANT MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Issues the Grant of Representation with comprehensive validation
   */
  issueGrant(
    grantId: string,
    applicantId: string,
    type: GrantType,
    issueDate: Date,
    options: {
      grantNumber: string;
      issuedBy: string;
      courtStation: string;
      courtCaseNumber: string;
      fileReference?: string;
      conditions?: string[];
      expiryDate?: Date;
    },
  ): void {
    // 1. Validate pre-conditions
    this.validateGrantIssuancePreconditions();

    // 2. Check for active disputes
    const hasActiveDispute = Array.from(this.disputes.values()).some((d) =>
      ['FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING'].includes(d.getStatus()),
    );

    if (hasActiveDispute) {
      throw new Error('Cannot issue Grant while there are active disputes.');
    }

    // 3. Check case readiness
    if (!this.probateCase.canIssueGrant()) {
      throw new Error(
        'Case is not ready for Grant issuance (gazette period or other requirements pending).',
      );
    }

    if (this.certificate) {
      throw new Error('Grant has already been issued for this case.');
    }

    // 4. Create the succession certificate
    this.certificate = SuccessionCertificate.create(
      grantId,
      this.probateCase.getEstateId(),
      applicantId,
      type,
      issueDate,
      {
        grantNumber: options.grantNumber,
        courtStation: options.courtStation,
        courtCaseNumber: options.courtCaseNumber,
        issuedBy: options.issuedBy,
        fileReference: options.fileReference,
        conditions: options.conditions,
        expiryDate: options.expiryDate,
      },
    );

    // 5. Link grant to probate case
    this.probateCase.issueGrant(
      grantId,
      options.grantNumber,
      issueDate,
      options.issuedBy,
      options.expiryDate,
    );

    // 6. Apply grant issued event
    this.apply(
      new GrantIssuedEvent(
        grantId,
        this.probateCase.getEstateId(),
        applicantId,
        issueDate,
        type,
        options.grantNumber,
        options.courtStation,
        options.expiryDate,
        options.conditions,
      ),
    );
  }

  /**
   * Confirms the grant after successful confirmation hearing
   */
  confirmGrant(
    confirmationDate: Date,
    confirmedBy: string,
    options?: {
      courtOrderNumber?: string;
      confirmationNotes?: string;
    },
  ): void {
    if (!this.certificate) {
      throw new Error('No Grant exists to confirm.');
    }

    // Validate confirmation pre-conditions
    if (!this.certificate.canBeConfirmed()) {
      throw new Error('Grant cannot be confirmed yet (minimum time period not elapsed).');
    }

    this.certificate.confirmGrant(confirmationDate, confirmedBy, options);
    this.probateCase.confirmGrant(confirmationDate, confirmedBy);
  }

  /**
   * Revokes the grant (Section 76)
   */
  revokeGrant(
    revocationDate: Date,
    revocationReason: string,
    revokedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (!this.certificate) {
      throw new Error('No Grant exists to revoke.');
    }

    this.certificate.revokeGrant(revocationDate, revocationReason, revokedBy, courtOrderNumber);

    // Update probate case status
    this.probateCase.withdrawCase(`Grant revoked: ${revocationReason}`, revokedBy);
  }

  // --------------------------------------------------------------------------
  // ESTATE ADMINISTRATION
  // --------------------------------------------------------------------------

  /**
   * Adds estate inventory item
   */
  addInventoryItem(
    inventoryId: string,
    description: string,
    estimatedValue: AssetValue,
    assetCategory: AssetCategory,
    ownershipType: OwnershipType,
    options?: {
      assetId?: string;
      ownedByDeceased?: boolean;
      locationDetails?: any;
      identificationDetails?: any;
    },
  ): void {
    const inventoryItem = EstateInventory.create(
      inventoryId,
      this.probateCase.getEstateId(),
      description,
      estimatedValue,
      assetCategory,
      ownershipType,
      options,
    );

    this.inventory.set(inventoryId, inventoryItem);
  }

  /**
   * Verifies an inventory item
   */
  verifyInventoryItem(
    inventoryId: string,
    verifiedBy: string,
    verificationMethod: string,
    notes?: string,
  ): void {
    const inventoryItem = this.inventory.get(inventoryId);
    if (!inventoryItem) {
      throw new Error('Inventory item not found.');
    }

    inventoryItem.verify(verifiedBy, verificationMethod, { notes });
  }

  /**
   * Assigns executor duty
   */
  assignExecutorDuty(
    dutyId: string,
    executorId: string,
    type: ExecutorDutyType,
    description: string,
    stepOrder: number,
    deadline: Date,
    options?: {
      priority?: any;
      legalBasis?: any;
      courtOrderNumber?: string;
    },
  ): void {
    const duty = ExecutorDuty.assign(
      dutyId,
      this.probateCase.getEstateId(),
      executorId,
      type,
      description,
      stepOrder,
      deadline,
      options,
    );

    this.executorDuties.set(dutyId, duty);
  }

  /**
   * Completes an executor duty
   */
  completeExecutorDuty(
    dutyId: string,
    completedBy: string,
    options?: {
      notes?: string;
      supportingDocuments?: string[];
    },
  ): void {
    const duty = this.executorDuties.get(dutyId);
    if (!duty) {
      throw new Error('Executor duty not found.');
    }

    duty.complete(new Date(), { ...options, completedBy });
  }

  /**
   * Creates distribution for beneficiary
   */
  createDistribution(
    distributionId: string,
    beneficiaryId: string,
    beneficiaryType: BeneficiaryType,
    sharePercentage: number,
    shareType: ShareType,
    options?: {
      assetId?: string;
      externalBeneficiaryName?: string;
      externalBeneficiaryContact?: string;
      condition?: string;
      legalDescription?: string;
    },
  ): void {
    if (!this.certificate?.isConfirmed()) {
      throw new Error('Grant must be confirmed before creating distributions.');
    }

    const distribution = Distribution.create(
      distributionId,
      this.probateCase.getEstateId(),
      beneficiaryId,
      beneficiaryType,
      sharePercentage,
      shareType,
      options,
    );

    this.distributions.set(distributionId, distribution);
  }

  /**
   * Completes asset distribution
   */
  completeDistribution(
    distributionId: string,
    transferMethod: TransferMethod,
    options?: {
      notes?: string;
      reference?: string;
      transferValue?: number;
      completedBy?: string;
    },
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution not found.');
    }

    distribution.completeTransfer(new Date(), transferMethod, options);
  }

  // --------------------------------------------------------------------------
  // CASE CLOSURE
  // --------------------------------------------------------------------------

  /**
   * Closes the probate case after successful completion
   */
  closeCase(closureReason: string, closedBy: string, finalDistributionDate?: Date): void {
    // Validate closure pre-conditions
    this.validateCaseClosurePreconditions();

    this.probateCase.closeCase(closureReason, closedBy, finalDistributionDate);

    this.apply(
      new CaseClosedEvent(
        this.probateCase.getId(),
        this.probateCase.getEstateId(),
        new Date(),
        closureReason,
        closedBy,
        finalDistributionDate,
      ),
    );
  }

  /**
   * Withdraws the probate case
   */
  withdrawCase(reason: string, withdrawnBy: string): void {
    this.probateCase.withdrawCase(reason, withdrawnBy);

    // Also revoke any issued grant
    if (this.certificate) {
      this.certificate.revokeGrant(new Date(), `Case withdrawn: ${reason}`, withdrawnBy);
    }
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS LOGIC
  // --------------------------------------------------------------------------

  private validateGrantIssuancePreconditions(): void {
    const status = this.probateCase.getStatus();

    if (!['FILED', 'GAZETTED', 'OBJECTION_PERIOD', 'HEARING_COMPLETED'].includes(status)) {
      throw new Error(`Case status ${status} is not valid for grant issuance.`);
    }

    // Check if gazette notice period has matured
    const gazetteNotice = this.probateCase.getGazetteNotice();
    if (gazetteNotice && !gazetteNotice.hasMatured()) {
      throw new Error('Gazette notice objection period has not yet expired.');
    }

    // Check inventory completeness (simplified)
    const inventoryItems = Array.from(this.inventory.values());
    if (inventoryItems.length === 0) {
      throw new Error('Estate inventory must be completed before grant issuance.');
    }

    const verifiedItems = inventoryItems.filter((item) => item.getIsVerified());
    if (verifiedItems.length < inventoryItems.length * 0.8) {
      // 80% verification threshold
      throw new Error('Majority of estate inventory must be verified before grant issuance.');
    }
  }

  private validateCaseClosurePreconditions(): void {
    if (this.probateCase.getStatus() !== 'CONFIRMED') {
      throw new Error('Only confirmed cases can be closed.');
    }

    if (!this.certificate?.isConfirmed()) {
      throw new Error('Grant must be confirmed before case closure.');
    }

    // Check if all distributions are completed
    const pendingDistributions = Array.from(this.distributions.values()).filter(
      (d) => d.getStatus() !== 'COMPLETED',
    );

    if (pendingDistributions.length > 0) {
      throw new Error(
        `There are ${pendingDistributions.length} pending distributions that must be completed.`,
      );
    }

    // Check if all executor duties are completed
    const pendingDuties = Array.from(this.executorDuties.values()).filter(
      (d) => !['COMPLETED', 'WAIVED'].includes(d.getStatus()),
    );

    if (pendingDuties.length > 0) {
      throw new Error(
        `There are ${pendingDuties.length} pending executor duties that must be completed.`,
      );
    }
  }

  private isObjectionPeriodActive(): boolean {
    return this.probateCase.isObjectionPeriodActive();
  }

  private areAllDisputesResolved(): boolean {
    const disputes = Array.from(this.disputes.values());
    return (
      disputes.length === 0 ||
      disputes.every((d) => ['RESOLVED', 'DISMISSED'].includes(d.getStatus()))
    );
  }

  private determineNextSteps(hearingType: HearingType, outcome: string): string[] {
    const nextSteps: string[] = [];

    switch (hearingType) {
      case 'CONFIRMATION_OF_GRANT':
        if (outcome.toLowerCase().includes('confirmed')) {
          nextSteps.push('Proceed with asset distribution');
          nextSteps.push('File final accounts with court');
        }
        break;
      case 'OBJECTION_HEARING':
        if (outcome.toLowerCase().includes('dismissed')) {
          nextSteps.push('Proceed with grant issuance');
        } else if (outcome.toLowerCase().includes('upheld')) {
          nextSteps.push('Amend grant application');
          nextSteps.push('Re-publish gazette notice if required');
        }
        break;
      case 'PROOF_OF_WILL':
        if (outcome.toLowerCase().includes('proved')) {
          nextSteps.push('Issue grant of probate');
        } else {
          nextSteps.push('Treat estate as intestate');
        }
        break;
    }

    return nextSteps;
  }

  private updateCaseStatusAfterHearing(hearingType: HearingType, outcome: string): void {
    switch (hearingType) {
      case 'CONFIRMATION_OF_GRANT':
        if (outcome.toLowerCase().includes('confirmed')) {
          this.probateCase.confirmGrant(new Date(), 'court');
        }
        break;
      case 'OBJECTION_HEARING':
        this.probateCase.recordHearingOutcome('objection-hearing', outcome);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  /**
   * Gets case progress summary
   */
  getProgressSummary(): {
    completionPercentage: number;
    completedSteps: string[];
    pendingSteps: string[];
    nextActions: string[];
  } {
    const completedSteps: string[] = [];
    const pendingSteps: string[] = [];

    // Case filing
    if (this.probateCase.getStatus() !== 'DRAFT_FILING') {
      completedSteps.push('Case filed with court');
    } else {
      pendingSteps.push('File case with court');
    }

    // Gazette notice
    if (this.probateCase.getGazetteNotice()) {
      completedSteps.push('Gazette notice published');
    } else if (this.probateCase.getStatus() === 'FILED') {
      pendingSteps.push('Publish gazette notice');
    }

    // Grant issuance
    if (this.certificate) {
      completedSteps.push('Grant issued');

      // Grant confirmation
      if (this.certificate.isConfirmed()) {
        completedSteps.push('Grant confirmed');
      } else {
        pendingSteps.push('Confirm grant');
      }
    } else if (this.probateCase.canIssueGrant()) {
      pendingSteps.push('Issue grant');
    }

    // Distributions
    const totalDistributions = this.distributions.size;
    const completedDistributions = Array.from(this.distributions.values()).filter(
      (d) => d.getStatus() === 'COMPLETED',
    ).length;

    if (totalDistributions > 0) {
      completedSteps.push(
        `Distributions: ${completedDistributions}/${totalDistributions} completed`,
      );
    }

    // Calculate completion percentage
    const totalSteps = completedSteps.length + pendingSteps.length;
    const completionPercentage = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

    return {
      completionPercentage: Math.round(completionPercentage),
      completedSteps,
      pendingSteps,
      nextActions: this.probateCase.getNextRequiredAction()
        ? [this.probateCase.getNextRequiredAction()]
        : [],
    };
  }

  /**
   * Checks if case is overdue
   */
  isCaseOverdue(): { overdue: boolean; reason?: string; daysOverdue?: number } {
    if (this.probateCase.isOverdue()) {
      const filingDate = this.probateCase.getFilingDate();
      // Safe calculation if filingDate is null (though it shouldn't be if overdue)
      const days = filingDate
        ? Math.floor((new Date().getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        overdue: true,
        reason: 'Case has been inactive for over 1 year',
        daysOverdue: Math.max(0, days - 365),
      };
    }
    return { overdue: false };
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getCase(): ProbateCase {
    return this.probateCase;
  }

  getCertificate(): SuccessionCertificate | null {
    return this.certificate;
  }

  getHearings(): CourtHearing[] {
    return Array.from(this.hearings.values());
  }

  getDisputes(): Dispute[] {
    return Array.from(this.disputes.values());
  }

  getExecutorDuties(): ExecutorDuty[] {
    return Array.from(this.executorDuties.values());
  }

  getInventory(): EstateInventory[] {
    return Array.from(this.inventory.values());
  }

  getDistributions(): Distribution[] {
    return Array.from(this.distributions.values());
  }

  getActiveDisputes(): Dispute[] {
    return Array.from(this.disputes.values()).filter(
      (d) => !['RESOLVED', 'DISMISSED'].includes(d.getStatus()),
    );
  }

  getPendingDuties(): ExecutorDuty[] {
    return Array.from(this.executorDuties.values()).filter(
      (d) => !['COMPLETED', 'WAIVED'].includes(d.getStatus()),
    );
  }

  getTotalEstateValue(): number {
    return Array.from(this.inventory.values()).reduce(
      (total, item) => total + item.getValue().getAmount(),
      0,
    );
  }
}
