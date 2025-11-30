// send-witness-invitation.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SendWitnessInvitationDto {
  @IsString()
  @IsNotEmpty()
  invitationMethod: string; // e.g., 'EMAIL', 'SMS', 'IN_PERSON'
}
