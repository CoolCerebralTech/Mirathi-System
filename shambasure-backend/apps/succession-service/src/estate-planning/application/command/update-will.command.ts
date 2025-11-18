// estate-planning/application/commands/update-will.command.ts
export class UpdateWillCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly title?: string,
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
  ) {}
}
