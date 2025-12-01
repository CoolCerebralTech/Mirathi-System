// add-dependant-provision.command.ts
import { ICommand } from '@nestjs/cqrs';

export class AddDependantProvisionCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly provisionDetails: string,
  ) {}
}
