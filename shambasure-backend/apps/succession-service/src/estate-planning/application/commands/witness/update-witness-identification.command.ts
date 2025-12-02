// update-witness-identification.command.ts
import { WitnessVerificationMethod } from '@prisma/client';

export class UpdateWitnessIdentificationCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly identification: {
      idNumber?: string;
      idType?: WitnessVerificationMethod;
      idDocumentId?: string;
    },
  ) {}
}
