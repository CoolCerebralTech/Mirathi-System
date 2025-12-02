// create-witness-for-professional.command.ts
import { WitnessType } from '@prisma/client';

export class CreateWitnessForProfessionalCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly professionalCapacity: string,
    public readonly professionalLicense?: string,
    public readonly relationship: string = 'Professional Witness',
    public readonly witnessType: WitnessType = WitnessType.PROFESSIONAL_WITNESS,
  ) {}
}
