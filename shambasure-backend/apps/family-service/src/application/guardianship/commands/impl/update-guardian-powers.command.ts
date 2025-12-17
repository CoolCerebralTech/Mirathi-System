// application/guardianship/commands/impl/update-guardian-powers.command.ts
import { Command } from '../base.command';

export interface UpdateGuardianPowersCommandProps {
  guardianshipId: string;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: Record<string, any>;
  specialInstructions?: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class UpdateGuardianPowersCommand extends Command<UpdateGuardianPowersCommandProps> {
  constructor(props: UpdateGuardianPowersCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'UpdateGuardianPowersCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');

    // At least one field should be updated
    const hasUpdates = 
      this.props.canConsentToMedical !== undefined ||
      this.props.canConsentToMarriage !== undefined ||
      this.props.restrictions !== undefined ||
      this.props.specialInstructions !== undefined;

    if (!hasUpdates) {
      errors.push('At least one power field must be updated');
    }

    return errors;
  }
}