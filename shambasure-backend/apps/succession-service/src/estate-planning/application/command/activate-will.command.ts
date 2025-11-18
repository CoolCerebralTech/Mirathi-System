// estate-planning/application/commands/activate-will.command.ts
export class ActivateWillCommand {
  constructor(
    public readonly willId: string,
    public readonly activatedBy: string, // userId of admin/notary
    public readonly legalCapacityAssessment: {
      isOfAge: boolean;
      isSoundMind: boolean;
      understandsWillNature: boolean;
      understandsAssetExtent: boolean;
      understandsBeneficiaryClaims: boolean;
      freeFromUndueInfluence: boolean;
      assessedBy?: string;
    },
  ) {}
}
