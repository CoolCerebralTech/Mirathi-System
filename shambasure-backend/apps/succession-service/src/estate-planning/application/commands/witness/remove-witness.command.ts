// remove-witness.command.ts
export class RemoveWitnessCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly removalReason?: string,
  ) {}
}
