// reject-witness.command.ts
export class RejectWitnessCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly rejectionReason: string,
  ) {}
}
