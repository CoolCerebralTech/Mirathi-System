// remove-will-witness.command.ts
import { ICommand } from '@nestjs/cqrs';

export class RemoveWillWitnessCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly witnessId: string,
    public readonly reason?: string,
  ) {}
}
