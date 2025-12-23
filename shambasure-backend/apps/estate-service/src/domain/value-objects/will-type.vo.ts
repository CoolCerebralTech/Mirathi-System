// domain/value-objects/will-type.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Will Type Value Object
 *
 * Kenyan Legal Context:
 * - Section 11 LSA: Standard will requirements (signed, witnessed)
 * - Section 14 LSA: Privileged wills (soldiers, sailors - not implemented)
 * - Joint wills are discouraged but legally valid
 * - Mutual wills create contractual obligations
 *
 * Types:
 * - STANDARD: Normal will (99% of cases)
 * - JOINT_WILL: Two testators, one document (rare, complex)
 * - MUTUAL_WILL: Two separate wills with reciprocal provisions
 * - HOLOGRAPHIC: Handwritten will (valid if meets S.11 requirements)
 * - INTERNATIONAL: For assets in multiple countries
 * - TESTAMENTARY_TRUST_WILL: Creates trust on death
 */
export enum WillTypeEnum {
  STANDARD = 'STANDARD',
  JOINT_WILL = 'JOINT_WILL',
  MUTUAL_WILL = 'MUTUAL_WILL',
  HOLOGRAPHIC = 'HOLOGRAPHIC',
  INTERNATIONAL = 'INTERNATIONAL',
  TESTAMENTARY_TRUST_WILL = 'TESTAMENTARY_TRUST_WILL',
}

interface WillTypeProps {
  value: WillTypeEnum;
  requiresSpecialHandling: boolean;
  allowsDigitalSignature: boolean;
  description: string;
}

export class WillType extends SimpleValueObject<WillTypeEnum> {
  private constructor(value: WillTypeEnum) {
    super(value);
  }

  protected validate(): void {
    if (!Object.values(WillTypeEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid will type: ${this.props.value}`, 'type');
    }
  }

  // Factory methods
  static standard(): WillType {
    return new WillType(WillTypeEnum.STANDARD);
  }

  static jointWill(): WillType {
    return new WillType(WillTypeEnum.JOINT_WILL);
  }

  static mutualWill(): WillType {
    return new WillType(WillTypeEnum.MUTUAL_WILL);
  }

  static holographic(): WillType {
    return new WillType(WillTypeEnum.HOLOGRAPHIC);
  }

  static international(): WillType {
    return new WillType(WillTypeEnum.INTERNATIONAL);
  }

  static testamentaryTrust(): WillType {
    return new WillType(WillTypeEnum.TESTAMENTARY_TRUST_WILL);
  }

  // Business logic
  public requiresSpecialHandling(): boolean {
    return [
      WillTypeEnum.JOINT_WILL,
      WillTypeEnum.MUTUAL_WILL,
      WillTypeEnum.INTERNATIONAL,
      WillTypeEnum.TESTAMENTARY_TRUST_WILL,
    ].includes(this.value);
  }

  public allowsDigitalSignature(): boolean {
    // Holographic wills typically require handwritten signatures
    return this.value !== WillTypeEnum.HOLOGRAPHIC;
  }

  public requiresNotarization(): boolean {
    return [WillTypeEnum.INTERNATIONAL, WillTypeEnum.TESTAMENTARY_TRUST_WILL].includes(this.value);
  }

  public getMinimumWitnessCount(): number {
    // Joint wills might require additional witnesses
    return this.value === WillTypeEnum.JOINT_WILL ? 3 : 2;
  }

  public getDescription(): string {
    const descriptions: Record<WillTypeEnum, string> = {
      [WillTypeEnum.STANDARD]: 'Standard will for single testator',
      [WillTypeEnum.JOINT_WILL]: 'Single document for two testators (not recommended)',
      [WillTypeEnum.MUTUAL_WILL]: 'Reciprocal wills between spouses',
      [WillTypeEnum.HOLOGRAPHIC]: 'Handwritten will',
      [WillTypeEnum.INTERNATIONAL]: 'Will covering assets in multiple jurisdictions',
      [WillTypeEnum.TESTAMENTARY_TRUST_WILL]: 'Will that creates trust upon death',
    };

    return descriptions[this.value];
  }

  public isStandard(): boolean {
    return this.value === WillTypeEnum.STANDARD;
  }

  public isJoint(): boolean {
    return this.value === WillTypeEnum.JOINT_WILL;
  }

  public isMutual(): boolean {
    return this.value === WillTypeEnum.MUTUAL_WILL;
  }

  public isHolographic(): boolean {
    return this.value === WillTypeEnum.HOLOGRAPHIC;
  }

  public isInternational(): boolean {
    return this.value === WillTypeEnum.INTERNATIONAL;
  }

  public involvesMultipleTestators(): boolean {
    return [WillTypeEnum.JOINT_WILL, WillTypeEnum.MUTUAL_WILL].includes(this.value);
  }
}
