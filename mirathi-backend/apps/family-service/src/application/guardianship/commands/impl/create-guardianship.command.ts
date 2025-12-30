// src/application/guardianship/commands/impl/create-guardianship.command.ts
import { Gender } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export interface CreateGuardianshipDto {
  // Ward Identity (Required to build FamilyMemberReferenceVO)
  wardId: string;
  wardFirstName: string;
  wardLastName: string; // Middle name optional in logic, but standardizing on Last
  wardDateOfBirth: Date;
  wardGender: Gender;
  wardIsAlive: boolean;

  // Guardianship Configuration
  guardianshipType: string; // e.g., 'TESTAMENTARY', 'COURT_APPOINTED'
  jurisdiction: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';
  requiresPropertyManagement: boolean;

  // Optional Legal Context
  courtOrder?: {
    caseNumber: string;
    courtStation: string; // e.g., 'Milimani High Court'
    orderDate: Date;
    judgeName?: string;
  };

  // Optional Metadata
  legalNotes?: string;
}

export class CreateGuardianshipCommand extends BaseCommand implements ICommand {
  public readonly payload: CreateGuardianshipDto;

  constructor(
    props: CreateGuardianshipDto & {
      userId: string;
      correlationId?: string;
    },
  ) {
    super({
      userId: props.userId,
      correlationId: props.correlationId,
    });
    this.payload = props;
    this.validatePayload();
  }

  private validatePayload(): void {
    if (!this.payload.wardId) throw new Error('Ward ID is required');
    if (!this.payload.wardDateOfBirth) throw new Error('Ward DOB is required');

    // Basic date validation
    if (new Date(this.payload.wardDateOfBirth) > new Date()) {
      throw new Error('Ward DOB cannot be in the future');
    }

    if (this.payload.courtOrder) {
      if (!this.payload.courtOrder.caseNumber) {
        throw new Error('Case Number is required when Court Order is present');
      }
    }
  }
}
