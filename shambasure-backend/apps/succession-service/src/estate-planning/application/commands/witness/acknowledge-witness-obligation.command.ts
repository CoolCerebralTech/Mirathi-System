// acknowledge-witness-obligation.command.ts
export class AcknowledgeWitnessObligationCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly acknowledgmentMethod?: string,
  ) {}
}
