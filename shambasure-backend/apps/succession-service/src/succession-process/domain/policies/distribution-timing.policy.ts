import { Injectable } from '@nestjs/common';
import { SUCCESSION_TIMEFRAMES } from '../../../common/constants/kenyan-law.constants';

@Injectable()
export class DistributionTimingPolicy {
  canConfirmGrant(
    grantIssuedDate: Date,
    gazettePublishedDate: Date | null,
  ): { allowed: boolean; remainingDays: number; reason?: string } {
    const now = new Date();

    // 1. Six Month Rule (Section 71)
    const sixMonthsMs =
      (SUCCESSION_TIMEFRAMES.PROBATE.CONFIRMATION_OF_GRANT || 180) * 24 * 60 * 60 * 1000;
    const earliestConfirmDate = new Date(grantIssuedDate.getTime() + sixMonthsMs);

    if (now < earliestConfirmDate) {
      const remaining = Math.ceil(
        (earliestConfirmDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        allowed: false,
        remainingDays: remaining,
        reason: 'Six-month statutory period from Grant Issue has not elapsed.',
      };
    }

    // 2. Gazette Notice (Section 67/68)
    if (!gazettePublishedDate) {
      return { allowed: false, remainingDays: 30, reason: 'Gazette Notice not published.' };
    }

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const noticeExpiry = new Date(gazettePublishedDate.getTime() + thirtyDaysMs);

    if (now < noticeExpiry) {
      const remaining = Math.ceil((noticeExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        allowed: false,
        remainingDays: remaining,
        reason: '30-day Gazette objection period has not elapsed.',
      };
    }

    return { allowed: true, remainingDays: 0 };
  }
}
