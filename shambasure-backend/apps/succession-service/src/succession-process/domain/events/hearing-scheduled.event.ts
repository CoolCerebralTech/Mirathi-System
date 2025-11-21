import { HearingType } from '../../../common/types/kenyan-law.types';

export class HearingScheduledEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly date: Date,
    public readonly type: HearingType,
    public readonly virtualLink?: string, // Support for Kenyan Judiciary E-Filing/Zoom
    public readonly timestamp: Date = new Date(),
  ) {}
}
