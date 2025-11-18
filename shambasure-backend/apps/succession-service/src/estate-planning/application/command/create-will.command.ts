// estate-planning/application/commands/create-will.command.ts
export class CreateWillCommand {
  constructor(
    public readonly testatorId: string,
    public readonly title: string,
    public readonly funeralWishes?: {
      burialLocation?: string;
      funeralType?: string;
      specificInstructions?: string;
    },
    public readonly residuaryClause?: string,
    public readonly digitalAssetInstructions?: {
      socialMediaHandling?: string;
      emailAccountHandling?: string;
    },
    public readonly specialInstructions?: string,
    public readonly requiresWitnesses: boolean = true,
  ) {}
}
