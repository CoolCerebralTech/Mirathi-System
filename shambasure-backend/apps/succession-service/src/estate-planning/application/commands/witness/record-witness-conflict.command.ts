// record-witness-conflict.command.ts
export class RecordWitnessConflictCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly conflictDetails: string,
  ) {}
}
