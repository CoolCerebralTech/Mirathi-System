import { SignatureType } from '@prisma/client';

export class WitnessSignedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly signedAt: Date,
    public readonly signatureType: SignatureType, // e.g., DIGITAL_SIGNATURE, WET_SIGNATURE
    public readonly timestamp: Date = new Date(),
  ) {}
}
