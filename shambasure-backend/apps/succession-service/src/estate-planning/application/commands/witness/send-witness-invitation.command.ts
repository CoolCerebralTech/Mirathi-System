// send-witness-invitation.command.ts
export class SendWitnessInvitationCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly invitationMethod: string,
  ) {}
}
