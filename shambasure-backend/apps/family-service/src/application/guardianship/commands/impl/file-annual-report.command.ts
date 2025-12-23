// application/guardianship/commands/impl/file-annual-report.command.ts
import { BaseCommand } from '../base.command';

export interface FileAnnualReportCommandPayload {
  guardianshipId: string;
  guardianId: string;
  reportDate: Date;
  summary: string;
  financialStatement?: Record<string, any>;
  approvedBy?: string;
}

export class FileAnnualReportCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly reportDate: Date;
  public readonly summary: string;
  public readonly financialStatement?: Record<string, any>;
  public readonly approvedBy?: string;

  constructor(
    payload: FileAnnualReportCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.reportDate = payload.reportDate;
    this.summary = payload.summary;
    this.financialStatement = payload.financialStatement;
    this.approvedBy = payload.approvedBy;

    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (!this.reportDate) throw new Error('Report date is required');
    if (!this.summary || this.summary.trim().length === 0)
      throw new Error('Report summary is required');
  }
}
