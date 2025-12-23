// domain/value-objects/revocation-method.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Revocation Method Value Object
 *
 * Kenyan Legal Context - Section 17 LSA:
 * "A will or codicil may be revoked or altered by the maker at any time
 * before his death by a later will or codicil, or by burning, tearing,
 * or otherwise destroying the will by the testator, or by some person
 * in his presence and by his direction."
 *
 * Also: "Every will shall be revoked by the marriage of the maker,
 * unless it appears from the will that it was made in contemplation
 * of that marriage."
 *
 * Valid Revocation Methods:
 * - NEW_WILL: Superseded by newer will (most common)
 * - CODICIL: Amendment via codicil document
 * - DESTRUCTION: Physical destruction (burning, tearing)
 * - COURT_ORDER: Court-ordered revocation (rare)
 * - MARRIAGE: Automatic revocation upon marriage (S.17 LSA)
 * - DIVORCE: May affect will provisions for ex-spouse
 * - OTHER: Unusual circumstances
 *
 * Business Rules:
 * - NEW_WILL is most common and cleanest
 * - DESTRUCTION requires witnesses
 * - MARRIAGE revokes unless will says "in contemplation of marriage"
 * - DIVORCE doesn't automatically revoke, but provisions to ex-spouse may fail
 */
export enum RevocationMethodEnum {
  NEW_WILL = 'NEW_WILL',
  CODICIL = 'CODICIL',
  DESTRUCTION = 'DESTRUCTION',
  COURT_ORDER = 'COURT_ORDER',
  MARRIAGE = 'MARRIAGE',
  DIVORCE = 'DIVORCE',
  OTHER = 'OTHER',
}

export class RevocationMethod extends SimpleValueObject<RevocationMethodEnum> {
  private constructor(value: RevocationMethodEnum) {
    super(value);
  }

  protected validate(): void {
    if (!Object.values(RevocationMethodEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(
        `Invalid revocation method: ${this.props.value}`,
        'method',
      );
    }
  }

  // Factory methods
  static newWill(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.NEW_WILL);
  }

  static codicil(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.CODICIL);
  }

  static destruction(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.DESTRUCTION);
  }

  static courtOrder(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.COURT_ORDER);
  }

  static marriage(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.MARRIAGE);
  }

  static divorce(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.DIVORCE);
  }

  static other(): RevocationMethod {
    return new RevocationMethod(RevocationMethodEnum.OTHER);
  }

  // Query methods
  public isNewWill(): boolean {
    return this.value === RevocationMethodEnum.NEW_WILL;
  }

  public isCodicil(): boolean {
    return this.value === RevocationMethodEnum.CODICIL;
  }

  public isDestruction(): boolean {
    return this.value === RevocationMethodEnum.DESTRUCTION;
  }

  public isCourtOrder(): boolean {
    return this.value === RevocationMethodEnum.COURT_ORDER;
  }

  public isMarriage(): boolean {
    return this.value === RevocationMethodEnum.MARRIAGE;
  }

  public isDivorce(): boolean {
    return this.value === RevocationMethodEnum.DIVORCE;
  }

  // Business logic
  public requiresWitnesses(): boolean {
    // Destruction should be witnessed to prevent disputes
    return this.isDestruction();
  }

  public requiresCourtApproval(): boolean {
    return this.isCourtOrder();
  }

  public isAutomatic(): boolean {
    // Marriage automatically revokes prior wills (S.17 LSA)
    return this.isMarriage();
  }

  public isExplicit(): boolean {
    // Explicit revocation by testator action
    return this.isNewWill() || this.isCodicil() || this.isDestruction();
  }

  public requiresDocumentation(): boolean {
    // These methods should have documentation
    return [
      RevocationMethodEnum.NEW_WILL,
      RevocationMethodEnum.CODICIL,
      RevocationMethodEnum.COURT_ORDER,
      RevocationMethodEnum.MARRIAGE,
      RevocationMethodEnum.DIVORCE,
    ].includes(this.value);
  }

  public getDescription(): string {
    const descriptions: Record<RevocationMethodEnum, string> = {
      [RevocationMethodEnum.NEW_WILL]: 'Superseded by a newer will',
      [RevocationMethodEnum.CODICIL]: 'Amended by codicil document',
      [RevocationMethodEnum.DESTRUCTION]: 'Physically destroyed by testator (S.17 LSA)',
      [RevocationMethodEnum.COURT_ORDER]: 'Revoked by court order',
      [RevocationMethodEnum.MARRIAGE]: 'Automatically revoked by marriage (S.17 LSA)',
      [RevocationMethodEnum.DIVORCE]: 'Affected by divorce decree',
      [RevocationMethodEnum.OTHER]: 'Other revocation method',
    };

    return descriptions[this.value];
  }

  public getLegalBasis(): string {
    const legalBasis: Record<RevocationMethodEnum, string> = {
      [RevocationMethodEnum.NEW_WILL]: 'Section 17(1) LSA - Later will revokes earlier will',
      [RevocationMethodEnum.CODICIL]: 'Section 17(1) LSA - Later codicil may revoke provisions',
      [RevocationMethodEnum.DESTRUCTION]: 'Section 17(2) LSA - Burning, tearing, or destroying',
      [RevocationMethodEnum.COURT_ORDER]: 'Court order under applicable law',
      [RevocationMethodEnum.MARRIAGE]:
        'Section 17(3) LSA - Marriage revokes will unless made in contemplation',
      [RevocationMethodEnum.DIVORCE]: 'Common law - Divorce may affect provisions',
      [RevocationMethodEnum.OTHER]: 'Other legal grounds',
    };

    return legalBasis[this.value];
  }

  // Validation: Check if revocation is complete
  public isCompleteRevocation(): boolean {
    // Divorce only revokes provisions to ex-spouse, not entire will
    // Codicil may only partially revoke
    return this.isNewWill() || this.isDestruction() || this.isCourtOrder() || this.isMarriage();
  }

  public isPartialRevocation(): boolean {
    return this.isDivorce() || this.isCodicil();
  }
}
