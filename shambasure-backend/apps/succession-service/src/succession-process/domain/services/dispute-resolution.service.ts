import { Inject, Injectable } from '@nestjs/common';
import { DisputeStatus, DisputeType } from '@prisma/client';

import { Dispute } from '../entities/dispute.entity';
import { DisputeGroundsPolicy } from '../policies/dispute-grounds.policy';
import type { DisputeRepositoryInterface } from '../repositories/dispute.repository.interface';

interface DisputeResolutionResult {
  success: boolean;
  resolutionType: 'MEDIATION' | 'COURT' | 'SETTLEMENT' | 'WITHDRAWN' | 'DISMISSED';
  outcome: string;
  nextSteps: string[];
  timeline?: Date;
}

interface MediationSession {
  sessionId: string;
  scheduledFor: Date;
  participants: string[];
  mediator?: string;
  outcome?: string;
}

interface DisputeCreationParams {
  willId: string;
  disputantId: string;
  type: DisputeType;
  description: string;
  supportingEvidence?: string[];
  lawyerName?: string;
  lawyerContact?: string;
  stage?: 'PRE_GRANT' | 'POST_GRANT';
}

@Injectable()
export class DisputeResolutionService {
  constructor(
    @Inject('DisputeRepositoryInterface')
    private readonly disputeRepository: DisputeRepositoryInterface,
    private readonly groundsPolicy: DisputeGroundsPolicy,
  ) {}

  /**
   * Validates and creates a new dispute
   */
  async createDispute(params: DisputeCreationParams): Promise<{
    success: boolean;
    dispute?: Dispute;
    errors: string[];
    warnings: string[];
    legalBasis?: string;
  }> {
    const {
      willId,
      disputantId,
      type,
      description,
      supportingEvidence = [],
      stage = 'PRE_GRANT',
    } = params;

    try {
      // 1. Policy Validation
      const policyCheck = this.groundsPolicy.validateObjection(
        type,
        description,
        stage,
        supportingEvidence,
      );

      if (!policyCheck.isValid) {
        return {
          success: false,
          errors: policyCheck.errors,
          warnings: policyCheck.warnings,
        };
      }

      // 2. Check for existing active disputes
      const existingDisputes = await this.disputeRepository.findByWillId(willId);
      const duplicate = existingDisputes.find(
        (dispute) =>
          dispute.getDisputantId() === disputantId && this.isActiveStatus(dispute.getStatus()),
      );

      if (duplicate) {
        return {
          success: false,
          errors: ['You already have an active dispute filed.'],
          warnings: policyCheck.warnings,
        };
      }

      // 3. Create dispute entity
      const disputeId = this.generateDisputeId();
      const dispute = Dispute.create(
        disputeId,
        willId,
        disputantId,
        type,
        description,
        supportingEvidence,
        {
          lawyerName: params.lawyerName,
          lawyerContact: params.lawyerContact,
        },
      );

      // 4. Save to repository
      await this.disputeRepository.save(dispute);

      return {
        success: true,
        dispute,
        errors: [],
        warnings: policyCheck.warnings,
        legalBasis: policyCheck.legalBasis,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        errors: [`Failed to create dispute: ${errorMessage}`],
        warnings: [],
      };
    }
  }

  /**
   * Recommends and initiates mediation process
   */
  async initiateMediation(
    disputeId: string,
    mediatorName: string,
    mediationDate: Date,
    location: string,
    initiatedBy: string,
  ): Promise<{
    success: boolean;
    session: MediationSession;
    reasons: string[];
    estimatedDuration: string;
  }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Check if mediation is recommended
      const mediationRecommendation = this.groundsPolicy.recommendMediation(
        dispute.getType(),
        'FAMILY',
        await this.getEstateValue(),
      );

      if (!mediationRecommendation.recommended) {
        throw new Error(`Mediation not recommended: ${mediationRecommendation.reason}`);
      }

      // Start mediation in the entity
      dispute.startMediation(mediatorName, mediationDate, location, initiatedBy);

      // Create mediation session
      const mediationSession: MediationSession = {
        sessionId: `MED-${disputeId}-${Date.now()}`,
        scheduledFor: mediationDate,
        participants: [dispute.getDisputantId()],
        mediator: mediatorName,
      };

      // Save changes
      await this.disputeRepository.save(dispute);

      return {
        success: true,
        session: mediationSession,
        reasons: [mediationRecommendation.reason],
        estimatedDuration: '4-6 weeks',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to initiate mediation: ${errorMessage}`);
    }
  }

  /**
   * Records mediation outcome
   */
  async recordMediationOutcome(
    disputeId: string,
    outcome: string,
    nextStep: 'RESOLVE' | 'ESCALATE' | 'CONTINUE_MEDIATION' = 'CONTINUE_MEDIATION',
  ): Promise<{ success: boolean; nextActions: string[] }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.recordMediationOutcome(outcome);

      const nextActions: string[] = [];

      switch (nextStep) {
        case 'RESOLVE':
          dispute.resolve(
            `Resolved through mediation: ${outcome}`,
            false,
            'Mediation Service',
            'SETTLEMENT',
          );
          nextActions.push('Draft settlement agreement', 'File with court for approval');
          break;
        case 'ESCALATE':
          nextActions.push('Prepare court documents', 'Schedule hearing');
          break;
        case 'CONTINUE_MEDIATION':
          nextActions.push('Schedule follow-up mediation session');
          break;
      }

      await this.disputeRepository.save(dispute);

      return { success: true, nextActions };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to record mediation outcome: ${errorMessage}`);
    }
  }

  /**
   * Escalates dispute to court proceedings
   */
  async escalateToCourt(
    disputeId: string,
    courtCaseNumber: string,
    courtName: string,
    filingDate: Date,
    filedBy: string,
  ): Promise<{
    success: boolean;
    courtDocuments: string[];
    estimatedTimeline: string;
    requirements: string[];
  }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // File in court through entity
      dispute.fileInCourt(courtCaseNumber, courtName, filingDate, filedBy);

      await this.disputeRepository.save(dispute);

      return {
        success: true,
        courtDocuments: [
          'Originating Summons',
          'Supporting Affidavit',
          'List of Exhibits',
          'Witness Statements',
        ],
        estimatedTimeline: '6-12 months',
        requirements: [
          'Legal representation recommended',
          'Court filing fees payable',
          'Mediation certificate required',
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to escalate to court: ${errorMessage}`);
    }
  }

  /**
   * Resolves dispute with various outcomes
   */
  async resolveDispute(
    disputeId: string,
    outcome: string,
    resolutionType: 'SETTLEMENT' | 'COURT' | 'WITHDRAWN' | 'DISMISSED',
    resolvedBy: string,
    courtOrderNumber?: string,
  ): Promise<DisputeResolutionResult> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const isDismissed = resolutionType === 'WITHDRAWN' || resolutionType === 'DISMISSED';

      // Map resolution type for entity (entity expects different string format)
      const entityResolutionType = resolutionType === 'COURT' ? 'COURT_JUDGMENT' : resolutionType;

      // Resolve through entity
      dispute.resolve(outcome, isDismissed, resolvedBy, entityResolutionType, courtOrderNumber);

      await this.disputeRepository.save(dispute);

      const resolutionResult: DisputeResolutionResult = {
        success: true,
        resolutionType,
        outcome,
        nextSteps: this.getNextStepsForResolution(resolutionType),
        timeline: new Date(),
      };

      return resolutionResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to resolve dispute: ${errorMessage}`);
    }
  }

  /**
   * Adds evidence to an existing dispute
   */
  async addEvidence(
    disputeId: string,
    evidenceUrl: string,
    description?: string,
  ): Promise<{ success: boolean; totalEvidence: number }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.addEvidence(evidenceUrl);

      // If description provided, update grounds
      if (description) {
        const grounds = dispute.getGrounds();
        grounds.addSupportingEvidence(description);
      }

      await this.disputeRepository.save(dispute);

      return {
        success: true,
        totalEvidence: dispute.getEvidenceUrls().length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to add evidence: ${errorMessage}`);
    }
  }

  /**
   * Checks if probate process is blocked by disputes
   */
  async checkProbateBlockStatus(willId: string): Promise<{
    blocked: boolean;
    blockingDisputes: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
  }> {
    const disputes = await this.disputeRepository.findByWillId(willId);
    const blockingStatuses: DisputeStatus[] = [
      'FILED',
      'UNDER_REVIEW',
      'MEDIATION',
      'COURT_PROCEEDING',
    ];

    const blockingDisputes = disputes
      .filter((dispute) => blockingStatuses.includes(dispute.getStatus()))
      .map((dispute) => dispute.getId());

    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const recommendations: string[] = [];

    if (blockingDisputes.length > 0) {
      const disputeTypes = disputes.map((dispute) => dispute.getType());

      if (disputeTypes.includes('FRAUD')) {
        severity = 'HIGH';
        recommendations.push('Immediate legal review required for fraud allegations');
      } else if (
        disputeTypes.includes('LACK_CAPACITY') ||
        disputeTypes.includes('UNDUE_INFLUENCE')
      ) {
        severity = 'MEDIUM';
        recommendations.push('Consider mediation for capacity/influence disputes');
      } else {
        severity = 'LOW';
        recommendations.push('Standard dispute resolution process can proceed');
      }

      const overdueDisputes = await this.disputeRepository.findOverdueDisputes();
      const willOverdueDisputes = overdueDisputes.filter((d) => d.getWillId() === willId);

      if (willOverdueDisputes.length > 0) {
        severity = 'HIGH';
        recommendations.push('Urgent action required: disputes exceeding resolution timeline');
      }
    }

    return {
      blocked: blockingDisputes.length > 0,
      blockingDisputes,
      severity,
      recommendations,
    };
  }

  /**
   * Gets dispute analytics and statistics
   */
  async getDisputeAnalytics(): Promise<{
    totalDisputes: number;
    resolvedDisputes: number;
    resolutionRate: number;
    averageResolutionTime: number;
    commonDisputeTypes: { type: DisputeType; count: number }[];
    overdueDisputes: number;
  }> {
    const allDisputes = await this.disputeRepository.findAll();
    const totalDisputes = allDisputes.length;

    const resolvedDisputes = allDisputes.filter((dispute) =>
      ['RESOLVED', 'WITHDRAWN', 'DISMISSED'].includes(dispute.getStatus()),
    ).length;

    const resolutionRate = totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0;

    // Calculate common dispute types
    const typeCounts: Record<DisputeType, number> = {} as Record<DisputeType, number>;
    allDisputes.forEach((dispute) => {
      const type = dispute.getType();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const commonDisputeTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as DisputeType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average resolution time
    const resolved = allDisputes.filter((dispute) => dispute.getStatus() === 'RESOLVED');
    const totalResolutionTime = resolved.reduce((sum, dispute) => {
      const filed = dispute.getCreatedAt();
      const resolved = dispute.getResolvedAt();
      if (filed && resolved) {
        return sum + (resolved.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);

    const averageResolutionTime = resolved.length > 0 ? totalResolutionTime / resolved.length : 0;

    const overdueDisputes = (await this.disputeRepository.findOverdueDisputes()).length;

    return {
      totalDisputes,
      resolvedDisputes,
      resolutionRate,
      averageResolutionTime,
      commonDisputeTypes,
      overdueDisputes,
    };
  }

  /**
   * Gets disputes that need attention
   */
  async getAttentionRequiredDisputes(): Promise<{
    overdue: Dispute[];
    noLawyer: Dispute[];
    courtHearingsSoon: Dispute[];
  }> {
    const allDisputes = await this.disputeRepository.findAll();
    const activeDisputes = allDisputes.filter((dispute) =>
      this.isActiveStatus(dispute.getStatus()),
    );

    const overdue = await this.disputeRepository.findOverdueDisputes();
    const noLawyer = activeDisputes.filter(
      (dispute) => !dispute.getLawyerName() && dispute.getStatus() === 'COURT_PROCEEDING',
    );
    const courtHearingsSoon = activeDisputes.filter((dispute) => {
      const hearingDate = dispute.getCourtDetails().nextHearingDate;
      if (!hearingDate) return false;

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return hearingDate <= sevenDaysFromNow && hearingDate >= new Date();
    });

    return {
      overdue,
      noLawyer,
      courtHearingsSoon,
    };
  }

  /**
   * Withdraws a dispute
   */
  async withdrawDispute(
    disputeId: string,
    reason: string,
    withdrawnBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.withdraw(reason, withdrawnBy);
      await this.disputeRepository.save(dispute);

      return {
        success: true,
        message: 'Dispute successfully withdrawn',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to withdraw dispute: ${errorMessage}`);
    }
  }

  /**
   * Updates court hearing details
   */
  async updateCourtHearing(
    disputeId: string,
    judgeName: string,
    nextHearingDate: Date,
  ): Promise<{ success: boolean }> {
    try {
      const dispute = await this.disputeRepository.findById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.updateCourtHearing(judgeName, nextHearingDate);
      await this.disputeRepository.save(dispute);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update court hearing: ${errorMessage}`);
    }
  }

  // Private helper methods
  private isActiveStatus(status: DisputeStatus): boolean {
    const activeStatuses: DisputeStatus[] = [
      'FILED',
      'UNDER_REVIEW',
      'MEDIATION',
      'COURT_PROCEEDING',
    ];
    return activeStatuses.includes(status);
  }

  private generateDisputeId(): string {
    return `DSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getEstateValue(): Promise<number> {
    // This would integrate with your estate planning service
    // For now, return a mock value - in production this would call:
    // const estate = await this.estateService.getEstateByWillId(willId);
    // return estate?.getTotalValue() || 0;

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return 5000000; // 5M KES mock value
  }

  private getNextStepsForResolution(
    resolutionType: 'SETTLEMENT' | 'COURT' | 'WITHDRAWN' | 'DISMISSED',
  ): string[] {
    const nextStepsMap: Record<string, string[]> = {
      SETTLEMENT: [
        'Draft and execute settlement agreement',
        'File settlement with court for approval',
        'Update estate distribution plan',
      ],
      COURT: [
        'File court order with probate registry',
        'Update estate records accordingly',
        'Implement court-directed distribution',
      ],
      WITHDRAWN: [
        'Record withdrawal in court files',
        'Notify all parties of withdrawal',
        'Resume probate process',
      ],
      DISMISSED: [
        'File dismissal order',
        'Close dispute records',
        'Continue with estate administration',
      ],
    };

    return nextStepsMap[resolutionType] || ['Complete administrative closure'];
  }
}
