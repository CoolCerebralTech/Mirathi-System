// sign-witness.command.ts
import { SignatureType } from '@prisma/client';

export class SignWitnessCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly signatureType: SignatureType,
    public readonly signatureData: string,
    public readonly signatureLocation: string,
    public readonly witnessingMethod: string,
    public readonly signingNotes?: string,
  ) {}
}
