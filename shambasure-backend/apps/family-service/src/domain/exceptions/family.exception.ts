export class InvalidFamilyMemberException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFamilyMemberException';
  }
}
