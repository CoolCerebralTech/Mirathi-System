// create-witness-for-external-individual.command.ts
import { WitnessType, WitnessVerificationMethod } from '@prisma/client';

export class CreateWitnessForExternalIndividualCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly fullName: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly relationship?: string,
    public readonly idNumber?: string,
    public readonly idType?: WitnessVerificationMethod,
    public readonly witnessType: WitnessType = WitnessType.EXTERNAL_INDIVIDUAL,
  ) {}
}
