export type CaseStatus =
  | 'DRAFT_FILING'
  | 'FILED'
  | 'GAZETTED'
  | 'OBJECTION_PERIOD'
  | 'OBJECTION_RECEIVED'
  | 'HEARING_SCHEDULED'
  | 'HEARING_COMPLETED'
  | 'GRANT_ISSUED'
  | 'CONFIRMATION_HEARING'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'CLOSED'
  | 'WITHDRAWN';

export class ProbateStatusChangedEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly oldStatus: CaseStatus,
    public readonly newStatus: CaseStatus,
    public readonly reason?: string,
    public readonly changedBy?: string,
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'ProbateStatusChangedEvent';
  }
}
