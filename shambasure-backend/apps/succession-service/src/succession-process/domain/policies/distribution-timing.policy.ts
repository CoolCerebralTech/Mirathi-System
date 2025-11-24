import { Injectable } from '@nestjs/common';
import { SUCCESSION_TIMEFRAMES } from '../../../common/constants/kenyan-law.constants';

interface TimelineInfo {
  timeline: string;
  reference: string;
  notes?: string;
}

@Injectable()
export class DistributionTimingPolicy {
  private readonly CONFIRMATION_PERIOD_DAYS =
    SUCCESSION_TIMEFRAMES.PROBATE?.CONFIRMATION_OF_GRANT || 180;
  private readonly OBJECTION_PERIOD_DAYS = 30;
  private readonly APPEAL_PERIOD_DAYS = 30;

  canConfirmGrant(
    grantIssuedDate: Date,
    gazettePublishedDate: Date | null,
    objections: { filingDate: Date; status: string }[] = [],
    hasComplexAssets: boolean = false,
  ): {
    allowed: boolean;
    remainingDays: number;
    nextEarliestDate: Date;
    reasons: string[];
    warnings: string[];
  } {
    const now = new Date();
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Six Month Rule (Section 71)
    const earliestConfirmDate = new Date(grantIssuedDate);
    earliestConfirmDate.setDate(earliestConfirmDate.getDate() + this.CONFIRMATION_PERIOD_DAYS);

    if (now < earliestConfirmDate) {
      const remaining = Math.ceil(
        (earliestConfirmDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      reasons.push(
        `Six-month statutory period from grant issuance has not elapsed. ${remaining} days remaining.`,
      );
    }

    // Gazette Notice Period (Section 67/68)
    if (!gazettePublishedDate) {
      reasons.push('Gazette notice has not been published.');
    } else {
      const noticeExpiry = new Date(gazettePublishedDate);
      noticeExpiry.setDate(noticeExpiry.getDate() + this.OBJECTION_PERIOD_DAYS);

      if (now < noticeExpiry) {
        const remaining = Math.ceil(
          (noticeExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        reasons.push(
          `30-day gazette objection period has not elapsed. ${remaining} days remaining.`,
        );
      }
    }

    // Pending Objections Check
    const pendingObjections = objections.filter(
      (obj) => obj.status === 'PENDING' || obj.status === 'UNDER_REVIEW',
    );
    if (pendingObjections.length > 0) {
      reasons.push(
        `There are ${pendingObjections.length} pending objection(s) that must be resolved.`,
      );
    }

    // Complex Assets Warning
    if (hasComplexAssets) {
      warnings.push(
        'Complex assets may require additional time for proper valuation and transfer.',
      );
    }

    // Calculate next earliest possible date
    const potentialDates = [earliestConfirmDate];
    if (gazettePublishedDate) {
      const noticeExpiry = new Date(gazettePublishedDate);
      noticeExpiry.setDate(noticeExpiry.getDate() + this.OBJECTION_PERIOD_DAYS);
      potentialDates.push(noticeExpiry);
    }

    const nextEarliestDate = new Date(Math.max(...potentialDates.map((d) => d.getTime())));

    return {
      allowed: reasons.length === 0,
      remainingDays:
        reasons.length > 0
          ? Math.ceil((nextEarliestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      nextEarliestDate,
      reasons,
      warnings,
    };
  }

  canDistributeAssets(
    grantConfirmedDate: Date,
    debtSettlementComplete: boolean,
    taxClearanceObtained: boolean,
    assetTypes: string[],
  ): {
    allowed: boolean;
    conditions: { met: boolean; description: string }[];
    recommendations: string[];
  } {
    const conditions: { met: boolean; description: string }[] = [
      { met: debtSettlementComplete, description: 'All priority debts settled' },
      { met: taxClearanceObtained, description: 'Tax clearance certificate obtained' },
      {
        met: this.hasSufficientTimeElapsed(grantConfirmedDate),
        description: 'Reasonable time elapsed since grant confirmation',
      },
    ];

    const recommendations: string[] = [];

    // Asset-specific recommendations
    if (assetTypes.includes('LAND')) {
      conditions.push({
        met: this.landTransferRequirementsMet(),
        description: 'Land transfer requirements satisfied',
      });
      recommendations.push('Ensure land rates and rent are up to date before transfer');
    }

    if (assetTypes.includes('BUSINESS_INTEREST')) {
      recommendations.push('Consider business valuation update if significant time has passed');
    }

    if (assetTypes.includes('FINANCIAL_ASSET')) {
      recommendations.push('Verify beneficiary bank account details before transfer');
    }

    return {
      allowed: conditions.every((condition) => condition.met),
      conditions,
      recommendations,
    };
  }

  getStatutoryTimelines(process: string): TimelineInfo {
    const timelines: Record<string, TimelineInfo> = {
      OBJECTION_FILING: {
        timeline: '30 days from gazette publication',
        reference: 'Section 68, Law of Succession Act',
        notes: 'Can be extended by court order',
      },
      CONFIRMATION_APPLICATION: {
        timeline: '6 months from grant issuance',
        reference: 'Section 71, Law of Succession Act',
        notes: 'Can be filed earlier with court permission',
      },
      APPEAL_FILING: {
        timeline: '30 days from decision',
        reference: 'Civil Procedure Rules',
        notes: 'Appeal period for probate matters',
      },
      SECTION_26_APPLICATION: {
        timeline: '6 months from grant confirmation',
        reference: 'Section 26, Law of Succession Act',
        notes: 'Application for reasonable provision for dependants',
      },
      EXECUTOR_ACCOUNTS: {
        timeline: 'Within 6 months of completion',
        reference: 'Section 83, Law of Succession Act',
        notes: 'Executor must file accounts with court',
      },
    };

    const defaultTimeline: TimelineInfo = {
      timeline: 'Varies by circumstance',
      reference: 'General succession practice',
      notes: 'Consult legal counsel for specific timelines',
    };

    return timelines[process] || defaultTimeline;
  }

  isAppealPeriodExpired(decisionDate: Date): { expired: boolean; daysRemaining: number } {
    const appealDeadline = new Date(decisionDate);
    appealDeadline.setDate(appealDeadline.getDate() + this.APPEAL_PERIOD_DAYS);

    const now = new Date();
    const daysRemaining = Math.ceil(
      (appealDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      expired: now > appealDeadline,
      daysRemaining: Math.max(0, daysRemaining),
    };
  }

  private hasSufficientTimeElapsed(confirmedDate: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return confirmedDate <= thirtyDaysAgo;
  }

  private landTransferRequirementsMet(): boolean {
    // Integration with land registry checks would happen here
    return true;
  }
}
