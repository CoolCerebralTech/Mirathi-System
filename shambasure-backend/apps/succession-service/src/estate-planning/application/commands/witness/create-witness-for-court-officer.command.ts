// create-witness-for-court-officer.command.ts
import { WitnessType } from '@prisma/client';

export class CreateWitnessForCourtOfficerCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly fullName: string,
    public readonly courtStation: string,
    public readonly badgeNumber?: string,
    public readonly witnessType: WitnessType = WitnessType.COURT_OFFICER,
  ) {}
}
