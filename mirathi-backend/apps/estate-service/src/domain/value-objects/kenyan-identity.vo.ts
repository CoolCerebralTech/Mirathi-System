// src/domain/value-objects/kenyan-identity.vo.ts
// -----------------------------------------------------------------------------
// NEW INNOVATION: Automatic validation of Kenyan specific identifiers
// -----------------------------------------------------------------------------
export class KenyanIdentity {
  // Regex for KRA PIN: A000000000Z
  private static readonly KRA_REGEX = /^[A-Z]\d{9}[A-Z]$/;
  // Regex for ID: 7-8 digits usually
  private static readonly ID_REGEX = /^\d{7,10}$/;

  static validateKraPin(pin: string): boolean {
    if (!this.KRA_REGEX.test(pin)) {
      throw new Error(`Invalid KRA PIN format: ${pin}. Expected format A000000000Z`);
    }
    return true;
  }

  static validateNationalId(id: string): boolean {
    if (!this.ID_REGEX.test(id)) {
      throw new Error(`Invalid National ID format: ${id}.`);
    }
    return true;
  }

  static formatTitleDeed(district: string, block: string, plot: string): string {
    return `${district}/${block}/${plot}`.toUpperCase();
  }
}
