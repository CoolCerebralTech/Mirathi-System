// src/domain/value-objects/guardianship-type.vo.ts
import { SimpleValueObject } from '../base/value-object';

export enum LegalGuardianshipType {
  TESTAMENTARY = 'TESTAMENTARY', // Appointed by Will (S.70 LSA)
  COURT_APPOINTED = 'COURT_APPOINTED', // By Children's Court
  CUSTOMARY = 'CUSTOMARY', // Recognized by clan elders
  NATURAL_PARENT = 'NATURAL_PARENT', // Default parent
  EMERGENCY = 'EMERGENCY', // Temporary for medical/travel
  MUTUAL = 'MUTUAL', // Both parents agree informally
}

export class GuardianshipTypeVO extends SimpleValueObject<LegalGuardianshipType> {
  private static readonly PROPERTY_TYPES = [
    LegalGuardianshipType.TESTAMENTARY,
    LegalGuardianshipType.COURT_APPOINTED,
  ];

  constructor(value: LegalGuardianshipType) {
    super(value);
  }

  protected validate(): void {
    if (!Object.values(LegalGuardianshipType).includes(this.value)) {
      throw new Error(`Invalid guardianship type: ${this.value}`);
    }
  }

  // 🎯 INNOVATIVE: Auto-detects if bond is required (S.72 LSA)
  public requiresBond(): boolean {
    return GuardianshipTypeVO.PROPERTY_TYPES.includes(this.value);
  }

  // 🎯 INNOVATIVE: Friendly description for users
  public getDescription(): string {
    const descriptions = {
      [LegalGuardianshipType.TESTAMENTARY]: 'Appointed in a Will (Section 70)',
      [LegalGuardianshipType.COURT_APPOINTED]: 'Court-appointed guardian',
      [LegalGuardianshipType.CUSTOMARY]: 'Recognized by clan elders',
      [LegalGuardianshipType.NATURAL_PARENT]: 'Biological or adoptive parent',
      [LegalGuardianshipType.EMERGENCY]: 'Temporary emergency guardian',
      [LegalGuardianshipType.MUTUAL]: 'Mutual agreement between parents',
    };
    return descriptions[this.value];
  }

  // 🎯 INNOVATIVE: Check if type requires court confirmation
  public requiresCourtConfirmation(): boolean {
    return this.value === LegalGuardianshipType.COURT_APPOINTED;
  }

  public static create(type: LegalGuardianshipType): GuardianshipTypeVO {
    return new GuardianshipTypeVO(type);
  }
}
