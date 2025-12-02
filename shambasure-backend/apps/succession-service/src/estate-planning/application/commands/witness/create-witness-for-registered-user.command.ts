// create-witness-for-registered-user.command.ts
import { WitnessType } from '@prisma/client';

export class CreateWitnessForRegisteredUserCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly witnessUserId: string,
    public readonly fullName: string,
    public readonly relationship?: string,
    public readonly witnessType: WitnessType = WitnessType.REGISTERED_USER,
  ) {}
}
