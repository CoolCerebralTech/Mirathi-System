// src/application/guardianship/queries/read-models/compliance-timeline.read-model.ts

export type TimelineEventType =
  | 'SCHEDULED'
  | 'DUE'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'AMENDMENT_REQUESTED'
  | 'OVERDUE'
  | 'REMINDER_SENT';

export interface TimelineEventItem {
  id: string; // Unique ID for keying list items
  date: Date;
  type: TimelineEventType;
  title: string;
  description: string;

  // UI Helpers
  statusColor: 'green' | 'amber' | 'red' | 'blue' | 'gray';
  icon: string; // e.g., 'file-check', 'alert-circle'

  // Context
  actor?: string; // Who did it?
  referenceId?: string; // e.g., submission confirmation ID
  documentUrl?: string; // If a document exists for this event
}

export class ComplianceTimelineReadModel {
  public readonly guardianshipId: string;
  public readonly wardName: string;
  public readonly summary: {
    totalReports: number;
    onTimeRate: number; // percentage
    nextDueDate?: Date;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
  };
  public readonly events: TimelineEventItem[];

  constructor(props: Partial<ComplianceTimelineReadModel>) {
    Object.assign(this, props);
  }
}
