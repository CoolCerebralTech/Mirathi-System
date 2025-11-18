// estate-planning/application/commands/add-witness.command.ts
export class AddWitnessCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly witnessType: 'USER' | 'EXTERNAL',
    public readonly witnessId?: string, // userId
    public readonly externalWitness?: {
      fullName: string;
      idNumber: string;
      email: string;
      phone: string;
      relationship?: string;
      address?: {
        street?: string;
        city?: string;
        county?: string;
      };
    },
  ) {}
}
