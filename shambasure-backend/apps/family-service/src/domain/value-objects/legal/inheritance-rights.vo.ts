// domain/value-objects/legal/inheritance-rights.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanLawSection } from './kenyan-law-section.vo';
import { RelationshipTypeVO } from './relationship-type.vo';

export type InheritanceRightsType = 'FULL' | 'PARTIAL' | 'CUSTOMARY' | 'NONE' | 'PENDING';
type RightsModifier =
  | 'conditional'
  | 'life interest'
  | 'testamentary override'
  | 'customary override';

export interface InheritanceRightsProps {
  rightsType: InheritanceRightsType;
  relationshipType: RelationshipTypeVO;
  applicableSections: KenyanLawSection[];
  sharePercentage: number; // 0-100
  isConditional: boolean;
  conditions?: string[];
  conditionsMet: boolean;
  isDisputed: boolean;
  disputeReason?: string;
  courtOrderNumber?: string;
  courtOrderDate?: Date;
  isLifeInterest: boolean;
  lifeInterestEnds?: Date;
  isTestamentaryOverride: boolean;
  testamentaryOverrideDetails?: string;
  isCustomaryOverride: boolean;
  customaryOverrideDetails?: string;
  notes?: string;
}

export class InheritanceRights extends ValueObject<InheritanceRightsProps> {
  private constructor(props: InheritanceRightsProps) {
    super(props);
    this.validate();
  }

  static create(
    rightsType: InheritanceRightsType,
    relationshipType: RelationshipTypeVO,
    sharePercentage: number,
  ): InheritanceRights {
    const applicableSections = this.determineApplicableSections(rightsType, relationshipType);

    return new InheritanceRights({
      rightsType,
      relationshipType,
      applicableSections,
      sharePercentage,
      isConditional: false,
      conditionsMet: true,
      isDisputed: false,
      isLifeInterest: false,
      isTestamentaryOverride: false,
      isCustomaryOverride: false,
    });
  }

  static createFromProps(props: InheritanceRightsProps): InheritanceRights {
    return new InheritanceRights(props);
  }

  private static determineApplicableSections(
    rightsType: InheritanceRightsType,
    relationshipType: RelationshipTypeVO,
  ): KenyanLawSection[] {
    const sections: KenyanLawSection[] = [];

    // Always include applicable sections from relationship type
    for (const sectionCode of relationshipType.applicableSections) {
      try {
        const section = KenyanLawSection.create(sectionCode as any);
        sections.push(section);
      } catch {
        console.warn(`Invalid section code: ${sectionCode}`);
      }
    }

    // Add sections based on rights type
    if (rightsType === 'CUSTOMARY') {
      sections.push(KenyanLawSection.create('S40_POLY_GAMY'));
    }

    if (rightsType === 'PENDING') {
      sections.push(KenyanLawSection.create('S26_DEPENDANT_PROVISION'));
    }

    return sections;
  }

  validate(): void {
    if (!this._value.rightsType) {
      throw new Error('Inheritance rights type is required');
    }

    if (!this._value.relationshipType) {
      throw new Error('Relationship type is required');
    }

    if (this._value.sharePercentage < 0 || this._value.sharePercentage > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    // Conditional validation
    if (
      this._value.isConditional &&
      (!this._value.conditions || this._value.conditions.length === 0)
    ) {
      throw new Error('Conditions are required when inheritance is conditional');
    }

    // Dispute validation
    if (this._value.isDisputed && !this._value.disputeReason) {
      throw new Error('Dispute reason is required when rights are disputed');
    }

    // Court order validation
    if (this._value.courtOrderNumber && !this._value.courtOrderDate) {
      throw new Error('Court order date is required when court order number is provided');
    }

    // Life interest validation
    if (this._value.isLifeInterest && !this._value.lifeInterestEnds) {
      throw new Error('Life interest end date is required when life interest is granted');
    }

    // Testamentary override validation
    if (this._value.isTestamentaryOverride && !this._value.testamentaryOverrideDetails) {
      throw new Error('Testamentary override details are required');
    }

    // Customary override validation
    if (this._value.isCustomaryOverride && !this._value.customaryOverrideDetails) {
      throw new Error('Customary override details are required');
    }

    // Validate that percentage matches rights type
    if (this._value.rightsType === 'NONE' && this._value.sharePercentage > 0) {
      throw new Error('Share percentage must be 0 when rights type is NONE');
    }

    if (this._value.rightsType === 'FULL' && this._value.sharePercentage < 100) {
      console.warn('Full rights typically imply 100% share');
    }
  }

  updateRightsType(rightsType: InheritanceRightsType): InheritanceRights {
    let sharePercentage = this._value.sharePercentage;

    // Adjust percentage based on rights type
    switch (rightsType) {
      case 'FULL':
        sharePercentage = 100;
        break;
      case 'NONE':
        sharePercentage = 0;
        break;
      case 'PARTIAL':
        sharePercentage = Math.min(sharePercentage, 50); // Cap at 50% for partial
        break;
    }

    const applicableSections = InheritanceRights.determineApplicableSections(
      rightsType,
      this._value.relationshipType,
    );

    return new InheritanceRights({
      ...this._value,
      rightsType,
      sharePercentage,
      applicableSections,
    });
  }

  updateSharePercentage(percentage: number): InheritanceRights {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    // Adjust rights type based on percentage
    let rightsType = this._value.rightsType;
    if (percentage === 0) {
      rightsType = 'NONE';
    } else if (percentage === 100) {
      rightsType = 'FULL';
    } else if (percentage > 0 && percentage < 100) {
      rightsType = 'PARTIAL';
    }

    return new InheritanceRights({
      ...this._value,
      rightsType,
      sharePercentage: percentage,
    });
  }

  addCondition(condition: string): InheritanceRights {
    const conditions = [...(this._value.conditions || []), condition];

    return new InheritanceRights({
      ...this._value,
      isConditional: true,
      conditions,
      conditionsMet: false,
    });
  }

  markConditionMet(condition: string): InheritanceRights {
    const allConditionsMet =
      this._value.conditions?.every((c) => c === condition || this._value.conditionsMet) ?? true;

    return new InheritanceRights({
      ...this._value,
      conditionsMet: allConditionsMet,
    });
  }

  disputeRights(reason: string): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      isDisputed: true,
      disputeReason: reason,
      rightsType: 'PENDING',
    });
  }

  resolveDispute(
    courtOrderNumber: string,
    courtOrderDate: Date,
    finalRightsType: InheritanceRightsType,
    finalSharePercentage: number,
  ): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      isDisputed: false,
      courtOrderNumber,
      courtOrderDate,
      rightsType: finalRightsType,
      sharePercentage: finalSharePercentage,
    });
  }

  grantLifeInterest(endDate: Date): InheritanceRights {
    if (endDate <= new Date()) {
      throw new Error('Life interest end date must be in the future');
    }

    return new InheritanceRights({
      ...this._value,
      isLifeInterest: true,
      lifeInterestEnds: endDate,
    });
  }

  endLifeInterest(): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      isLifeInterest: false,
      lifeInterestEnds: undefined,
    });
  }

  applyTestamentaryOverride(details: string): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      isTestamentaryOverride: true,
      testamentaryOverrideDetails: details,
      rightsType: 'FULL', // Testamentary override typically grants full rights
      sharePercentage: 100,
    });
  }

  applyCustomaryOverride(details: string): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      isCustomaryOverride: true,
      customaryOverrideDetails: details,
      rightsType: 'CUSTOMARY',
    });
  }

  updateNotes(notes: string): InheritanceRights {
    return new InheritanceRights({
      ...this._value,
      notes,
    });
  }

  get rightsType(): InheritanceRightsType {
    return this._value.rightsType;
  }

  get relationshipType(): RelationshipTypeVO {
    return this._value.relationshipType;
  }

  get applicableSections(): KenyanLawSection[] {
    return [...this._value.applicableSections];
  }

  get sharePercentage(): number {
    return this._value.sharePercentage;
  }

  get isConditional(): boolean {
    return this._value.isConditional;
  }

  get conditions(): string[] | undefined {
    return this._value.conditions;
  }

  get conditionsMet(): boolean {
    return this._value.conditionsMet;
  }

  get isDisputed(): boolean {
    return this._value.isDisputed;
  }

  get disputeReason(): string | undefined {
    return this._value.disputeReason;
  }

  get courtOrderNumber(): string | undefined {
    return this._value.courtOrderNumber;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get isLifeInterest(): boolean {
    return this._value.isLifeInterest;
  }

  get lifeInterestEnds(): Date | undefined {
    return this._value.lifeInterestEnds;
  }

  get isTestamentaryOverride(): boolean {
    return this._value.isTestamentaryOverride;
  }

  get testamentaryOverrideDetails(): string | undefined {
    return this._value.testamentaryOverrideDetails;
  }

  get isCustomaryOverride(): boolean {
    return this._value.isCustomaryOverride;
  }

  get customaryOverrideDetails(): string | undefined {
    return this._value.customaryOverrideDetails;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Check if rights are currently effective
  get isEffective(): boolean {
    if (this._value.isDisputed) return false;
    if (this._value.isConditional && !this._value.conditionsMet) return false;
    if (this._value.rightsType === 'NONE') return false;
    if (this._value.rightsType === 'PENDING') return false;
    return true;
  }

  // Check if life interest is still active
  get isLifeInterestActive(): boolean {
    if (!this._value.isLifeInterest || !this._value.lifeInterestEnds) return false;
    return new Date() <= this._value.lifeInterestEnds;
  }

  // Get days remaining in life interest
  get lifeInterestDaysRemaining(): number | null {
    if (!this._value.lifeInterestEnds) return null;

    const now = new Date();
    const diffTime = this._value.lifeInterestEnds.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get effective share percentage (considering conditions and life interest)
  get effectiveSharePercentage(): number {
    if (!this.isEffective) return 0;
    if (this._value.isLifeInterest && !this.isLifeInterestActive) return 0;
    return this._value.sharePercentage;
  }

  // Check if rights are based on statutory law
  get isStatutory(): boolean {
    return !this._value.isTestamentaryOverride && !this._value.isCustomaryOverride;
  }

  // Get inheritance rights description
  get rightsDescription(): string {
    const base = `${this._value.rightsType} inheritance rights`;
    const modifiers: RightsModifier[] = [];

    if (this._value.isConditional) modifiers.push('conditional');
    if (this._value.isLifeInterest) modifiers.push('life interest');
    if (this._value.isTestamentaryOverride) modifiers.push('testamentary override');
    if (this._value.isCustomaryOverride) modifiers.push('customary override');

    if (modifiers.length > 0) {
      return `${base} (${modifiers.join(', ')})`;
    }

    return base;
  }

  // Get legal basis summary
  get legalBasis(): string {
    if (this._value.isTestamentaryOverride) return 'Testamentary will';
    if (this._value.isCustomaryOverride) return 'Customary law';
    if (this._value.courtOrderNumber) return 'Court order';

    return `Law of Succession Act ${this._value.applicableSections.map((s) => s.sectionNumber).join(', ')}`;
  }

  toJSON() {
    return {
      rightsType: this._value.rightsType,
      relationshipType: this._value.relationshipType.toJSON(),
      applicableSections: this._value.applicableSections.map((s) => s.toJSON()),
      sharePercentage: this._value.sharePercentage,
      isConditional: this._value.isConditional,
      conditions: this._value.conditions,
      conditionsMet: this._value.conditionsMet,
      isDisputed: this._value.isDisputed,
      disputeReason: this._value.disputeReason,
      courtOrderNumber: this._value.courtOrderNumber,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      isLifeInterest: this._value.isLifeInterest,
      lifeInterestEnds: this._value.lifeInterestEnds?.toISOString(),
      isTestamentaryOverride: this._value.isTestamentaryOverride,
      testamentaryOverrideDetails: this._value.testamentaryOverrideDetails,
      isCustomaryOverride: this._value.isCustomaryOverride,
      customaryOverrideDetails: this._value.customaryOverrideDetails,
      notes: this._value.notes,
      isEffective: this.isEffective,
      isLifeInterestActive: this.isLifeInterestActive,
      lifeInterestDaysRemaining: this.lifeInterestDaysRemaining,
      effectiveSharePercentage: this.effectiveSharePercentage,
      isStatutory: this.isStatutory,
      rightsDescription: this.rightsDescription,
      legalBasis: this.legalBasis,
    };
  }
}
