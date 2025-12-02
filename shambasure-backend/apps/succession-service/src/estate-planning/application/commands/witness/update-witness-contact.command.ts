// update-witness-contact.command.ts
export class UpdateWitnessContactCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly contact: {
      email?: string;
      phone?: string;
      residentialCounty?: string;
    },
  ) {}
}
