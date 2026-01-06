export class LegalRequirement {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly legalBasis: string,
    public readonly isMandatory: boolean,
    public readonly appliesToRegime: string[],
  ) {}

  appliesTo(regime: string): boolean {
    return this.appliesToRegime.includes(regime);
  }
}
