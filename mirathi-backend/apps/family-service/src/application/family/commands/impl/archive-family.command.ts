import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to soft-delete an entire Family Tree.
 *
 * Investor Note / Privacy & Compliance:
 * We never "Hard Delete" legal data immediately due to audit requirements.
 * This command marks the tree as 'Archived' and removes it from active search,
 * but retains the history for the legal retention period.
 */
export class ArchiveFamilyCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly reason: string;

  constructor(props: { userId: string; familyId: string; reason: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.reason = props.reason;
  }

  public validate(): void {
    super.validate();
    if (!this.familyId) throw new Error('Family ID is required');
    if (!this.reason || this.reason.length < 5) {
      throw new Error('A valid reason for archiving is required (min 5 chars).');
    }
  }
}
