// estate-planning/application/commands/sign-will.command.ts
export class SignWillCommand {
  constructor(
    public readonly willId: string,
    public readonly witnessId: string,
    public readonly signatureData: string,
  ) {}
}
