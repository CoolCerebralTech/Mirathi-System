// src/domain/value-objects/family-member-reference.vo.ts
import { ValueObject } from '../base/value-object';
import { Gender } from './family-enums.vo';
import { KenyanNationalId } from './kenyan-identity.vo';
import { PersonName } from './person-name.vo';

/**
 * FamilyMemberReferenceVO - Cross-Aggregate Reference Value Object
 *
 * Purpose: Safely reference a FamilyMember from the Family aggregate
 *          while maintaining aggregate boundaries.
 *
 * Kenyan Legal Context:
 * - Guardianship requires verified identity (National ID, Birth Certificate)
 * - Age calculations follow Children Act (18 = majority)
 * - Customary law considerations for tribal communities
 *
 * Design Principles:
 * 1. IMMUTABLE: Once created, cannot be modified
 * 2. DENORMALIZED: Contains essential snapshot data
 * 3. SELF-VALIDATING: Ensures valid Kenyan identity data
 * 4. BOUNDARY-SAFE: No behavior that modifies Family aggregate
 */
export interface FamilyMemberReferenceProps {
  // Required Identity Data
  memberId: string; // ID from Family aggregate
  fullName: PersonName; // Denormalized name for display
  dateOfBirth: Date; // For age calculations
  gender: Gender; // For gender-specific rules

  // Life Status (Critical for guardianship eligibility)
  isAlive: boolean;
  isMinor: boolean; // Calculated: < 18 years

  // Kenyan Legal Identity (Verification)
  nationalId?: KenyanNationalId;
  nationalIdVerified: boolean;
  birthCertificateNumber?: string;

  // Contact Information (For notifications - optional)
  primaryPhone?: string;
  email?: string;

  // Cultural Context (For customary law applications)
  tribe?: string;
  religion?: string;

  // Verification Metadata
  referenceCreatedAt: Date;
  verificationStatus: 'UNVERIFIED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REJECTED';
  lastVerifiedAt?: Date;
}

export class FamilyMemberReferenceVO extends ValueObject<FamilyMemberReferenceProps> {
  constructor(props: FamilyMemberReferenceProps) {
    super(props);
  }

  // ---------------------------------------------------------------------------
  // 🔍 VALIDATION (Ensures valid Kenyan identity)
  // ---------------------------------------------------------------------------

  protected validate(): void {
    this.validateIdentityData();
    this.validateAgeConsistency();
    this.validateVerificationStatus();
    this.validateContactInformation();
  }

  private validateIdentityData(): void {
    if (!this.props.memberId || this.props.memberId.trim().length === 0) {
      throw new Error('Member ID is required');
    }

    if (!this.props.fullName) {
      throw new Error('Full name is required');
    }

    if (!this.props.dateOfBirth) {
      throw new Error('Date of birth is required');
    }

    if (this.props.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    // Validate age is reasonable (0-120 years)
    const age = this.calculateAge(this.props.dateOfBirth);
    if (age < 0 || age > 120) {
      throw new Error(`Invalid age calculated: ${age} years. Date of birth may be incorrect.`);
    }
  }

  private validateAgeConsistency(): void {
    const age = this.calculateAge(this.props.dateOfBirth);
    const isMinorCalculated = age < 18;

    if (this.props.isMinor !== isMinorCalculated) {
      throw new Error(
        `Age inconsistency: Calculated age ${age} doesn't match isMinor flag ${this.props.isMinor}`,
      );
    }

    // National ID typically issued at 18+ in Kenya
    if (this.props.nationalId && age < 6) {
      console.warn('National ID provided for child under 6 - unusual but possible');
    }
  }

  private validateVerificationStatus(): void {
    if (this.props.nationalIdVerified && !this.props.nationalId) {
      throw new Error('National ID must exist if marked as verified');
    }

    if (this.props.verificationStatus === 'VERIFIED' && !this.props.nationalIdVerified) {
      throw new Error('Verification status is VERIFIED but national ID is not verified');
    }
  }

  private validateContactInformation(): void {
    if (!this.props.primaryPhone && !this.props.email) {
      // Allow no contact for minors/wards (contact through guardian)
      if (this.props.isMinor) {
        console.warn('Family member reference created without contact information');
      }
    }

    if (this.props.primaryPhone && !this.isValidKenyanPhone(this.props.primaryPhone)) {
      throw new Error('Invalid Kenyan phone number format');
    }
  }

  private isValidKenyanPhone(phone: string): boolean {
    // Basic Kenyan phone validation
    const kenyanPhoneRegex = /^(?:254|\+254|0)?(7\d{8}|1\d{8})$/;
    return kenyanPhoneRegex.test(phone);
  }

  // ---------------------------------------------------------------------------
  // 🏭 FACTORY METHODS (Immutable creation)
  // ---------------------------------------------------------------------------

  public static createFromFamilyMember(
    memberId: string,
    fullName: PersonName,
    dateOfBirth: Date,
    gender: Gender,
    isAlive: boolean,
    options?: {
      userId?: string;
      nationalId?: KenyanNationalId;
      nationalIdVerified?: boolean;
      birthCertificateNumber?: string;
      primaryPhone?: string;
      email?: string;
      tribe?: string;
      religion?: string;
      verificationStatus?: 'UNVERIFIED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REJECTED';
    },
  ): FamilyMemberReferenceVO {
    // Calculate age
    const age = this.calculateAge(dateOfBirth);
    const isMinor = age < 18;

    const props: FamilyMemberReferenceProps = {
      memberId,
      fullName,
      dateOfBirth,
      gender,
      isAlive,
      isMinor,
      nationalId: options?.nationalId,
      nationalIdVerified: options?.nationalIdVerified || false,
      birthCertificateNumber: options?.birthCertificateNumber,
      primaryPhone: options?.primaryPhone,
      email: options?.email,
      tribe: options?.tribe,
      religion: options?.religion,
      referenceCreatedAt: new Date(),
      verificationStatus: options?.verificationStatus || 'UNVERIFIED',
    };

    return new FamilyMemberReferenceVO(props);
  }

  public static createForNewborn(
    memberId: string,
    fullName: PersonName,
    dateOfBirth: Date,
    gender: Gender,
    parentPhone: string,
  ): FamilyMemberReferenceVO {
    // Newborn specific validation
    const ageInDays = (new Date().getTime() - dateOfBirth.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 180) {
      // More than 6 months
      throw new Error('Use createFromFamilyMember for children over 6 months');
    }

    return this.createFromFamilyMember(
      memberId,
      fullName,
      dateOfBirth,
      gender,
      true, // isAlive
      {
        primaryPhone: parentPhone,
        birthCertificateNumber: `APPLICATION_PENDING_${memberId}`,
        verificationStatus: 'VERIFICATION_PENDING',
      },
    );
  }

  public static createVerifiedAdult(
    memberId: string,
    fullName: PersonName,
    dateOfBirth: Date,
    gender: Gender,
    nationalId: KenyanNationalId,
    primaryPhone: string,
  ): FamilyMemberReferenceVO {
    // Verify adult age
    const age = this.calculateAge(dateOfBirth);
    if (age < 18) {
      throw new Error('Adult reference requires age 18 or above');
    }

    return this.createFromFamilyMember(memberId, fullName, dateOfBirth, gender, true, {
      nationalId,
      nationalIdVerified: true,
      primaryPhone,
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // 🧮 CALCULATION METHODS (Derived data)
  // ---------------------------------------------------------------------------

  public getAge(atDate: Date = new Date()): number {
    return FamilyMemberReferenceVO.calculateAge(this.props.dateOfBirth, atDate);
  }

  private static calculateAge(birthDate: Date, atDate: Date = new Date()): number {
    let age = atDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = atDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && atDate.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if member qualifies for guardianship under Kenyan law
   * Children Act: Minors (under 18) and incapacitated adults
   */
  public qualifiesForGuardianship(): {
    qualifies: boolean;
    reason: 'MINOR' | 'INCAPACITATED_ADULT' | 'DISABLED_ADULT' | 'ELDERLY' | 'NONE';
    legalBasis: string;
  } {
    if (!this.props.isAlive) {
      return {
        qualifies: false,
        reason: 'NONE',
        legalBasis: 'Guardianship only applies to living persons',
      };
    }

    // Minor (Children Act Section 23)
    if (this.props.isMinor) {
      return {
        qualifies: true,
        reason: 'MINOR',
        legalBasis: 'Children Act Section 23: Persons under 18 years',
      };
    }

    // Incapacitated adult
    // Note: This would require additional data - for now, we assume false
    // In real system, this would come from FamilyMember entity

    return {
      qualifies: false,
      reason: 'NONE',
      legalBasis: 'Adult with full legal capacity',
    };
  }

  /**
   * Check if customary law applies based on tribe
   * Some Kenyan communities have specific customary guardianship rules
   */
  public customaryLawApplies(): boolean {
    const customaryTribes = [
      'KIKUYU',
      'LUO',
      'LUHYA',
      'KALENJIN',
      'KAMBA',
      'KISII',
      'MERU',
      'MAASAI',
      'TURKANA',
      'SOMALI',
      'MIJIKENDA',
      'TAITA',
      'EMBU',
      'THARAKA',
    ];

    return this.props.tribe ? customaryTribes.includes(this.props.tribe.toUpperCase()) : false;
  }

  // ---------------------------------------------------------------------------
  // 🔄 IMMUTABLE UPDATE METHODS (Return new instances)
  // ---------------------------------------------------------------------------

  /**
   * Update contact information - returns new VO
   */
  public updateContactInfo(contactInfo: {
    primaryPhone?: string;
    email?: string;
  }): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      ...contactInfo,
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  /**
   * Verify identity - returns new VO
   */
  public verifyIdentity(
    nationalId: KenyanNationalId,
    verifiedBy?: string,
  ): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      nationalId,
      nationalIdVerified: true,
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: new Date(),
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  /**
   * Record death - returns new VO
   */
  public recordDeath(): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      isAlive: false,
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  // ---------------------------------------------------------------------------
  // 📊 UTILITY METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get display name for legal documents
   */
  public getDisplayName(format: 'FULL' | 'FORMAL' | 'LEGAL' = 'FULL'): string {
    switch (format) {
      case 'FORMAL':
        return `${this.props.fullName.getFullName('FORMAL')}${
          this.props.nationalId ? ` (ID: ${this.props.nationalId})` : ''
        }`;

      case 'LEGAL':
        return `${this.props.fullName.getFullName('FORMAL')}${
          this.props.nationalId ? `, National ID: ${this.props.nationalId}` : ''
        }${
          this.props.birthCertificateNumber
            ? `, Birth Cert: ${this.props.birthCertificateNumber}`
            : ''
        }`;

      default:
        return this.props.fullName.getFullName();
    }
  }

  /**
   * Get summary for guardianship applications
   */
  public getGuardianshipSummary(): {
    identity: {
      name: string;
      age: number;
      gender: string;
      isMinor: boolean;
    };
    verification: {
      status: string;
      nationalId?: string;
      lastVerified?: Date;
    };
    contact: {
      phone?: string;
      email?: string;
    };
  } {
    return {
      identity: {
        name: this.props.fullName.getFullName(),
        age: this.getAge(),
        gender: this.props.gender,
        isMinor: this.props.isMinor,
      },
      verification: {
        status: this.props.verificationStatus,
        nationalId: this.props.nationalId?.toString(),
        lastVerified: this.props.lastVerifiedAt,
      },
      contact: {
        phone: this.props.primaryPhone,
        email: this.props.email,
      },
    };
  }

  /**
   * Check if reference needs re-verification
   * Kenyan legal requirement: Identity verification every 2 years for legal matters
   */
  public needsReVerification(): boolean {
    if (!this.props.lastVerifiedAt) return true;

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    return this.props.lastVerifiedAt < twoYearsAgo;
  }

  /**
   * Check if this reference can be used as a guardian
   * Guardians must be adults with verified identity
   */
  public canServeAsGuardian(): {
    canServe: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (!this.props.isAlive) {
      reasons.push('Person is deceased');
    }

    if (this.props.isMinor) {
      reasons.push('Person is a minor (under 18)');
    }

    if (!this.props.nationalIdVerified) {
      reasons.push('National ID not verified');
    }

    // Additional Kenyan requirements could be added:
    // - Not bankrupt
    // - No criminal record
    // - Not removed as guardian previously

    return {
      canServe: reasons.length === 0,
      reasons,
    };
  }

  // ---------------------------------------------------------------------------
  // 🎯 SERIALIZATION
  // ---------------------------------------------------------------------------

  public toJSON(): Record<string, any> {
    return {
      memberId: this.props.memberId,
      name: this.props.fullName.toJSON(),
      dateOfBirth: this.props.dateOfBirth,
      gender: this.props.gender,
      age: this.getAge(),
      isAlive: this.props.isAlive,
      isMinor: this.props.isMinor,
      identity: {
        nationalId: this.props.nationalId?.toJSON(),
        nationalIdVerified: this.props.nationalIdVerified,
        birthCertificateNumber: this.props.birthCertificateNumber,
      },
      contact: {
        primaryPhone: this.props.primaryPhone,
        email: this.props.email,
      },
      cultural: {
        tribe: this.props.tribe,
        religion: this.props.religion,
        customaryLawApplies: this.customaryLawApplies(),
      },
      verification: {
        status: this.props.verificationStatus,
        lastVerifiedAt: this.props.lastVerifiedAt,
        needsReVerification: this.needsReVerification(),
      },
      guardianshipEligibility: {
        qualifies: this.qualifiesForGuardianship().qualifies,
        reason: this.qualifiesForGuardianship().reason,
        legalBasis: this.qualifiesForGuardianship().legalBasis,
      },
      guardianEligibility: this.canServeAsGuardian(),
      referenceCreatedAt: this.props.referenceCreatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // 🛡️ GETTERS (Read-only access)
  // ---------------------------------------------------------------------------

  public get memberId(): string {
    return this.props.memberId;
  }

  public get fullName(): PersonName {
    return this.props.fullName;
  }

  public get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  public get gender(): Gender {
    return this.props.gender;
  }

  public get isAlive(): boolean {
    return this.props.isAlive;
  }

  public get isMinor(): boolean {
    return this.props.isMinor;
  }

  public get nationalIdVerified(): boolean {
    return this.props.nationalIdVerified;
  }

  public get verificationStatus(): string {
    return this.props.verificationStatus;
  }
}

// -----------------------------------------------------------------------------
// 🎯 TYPE GUARDS (Optional but useful)
// -----------------------------------------------------------------------------

/**
 * Type guard to check if object is a FamilyMemberReferenceVO
 */
export function isFamilyMemberReferenceVO(obj: any): obj is FamilyMemberReferenceVO {
  return obj instanceof FamilyMemberReferenceVO;
}

/**
 * Helper to create reference from existing data (for persistence restore)
 */
export function restoreFamilyMemberReference(data: any): FamilyMemberReferenceVO {
  // This would need proper parsing based on your persistence format
  // Simplified example:
  const props: FamilyMemberReferenceProps = {
    memberId: data.memberId,
    fullName: PersonName.create(data.fullName),
    dateOfBirth: new Date(data.dateOfBirth),
    gender: data.gender as Gender,
    isAlive: data.isAlive,
    isMinor: data.isMinor,
    nationalId: data.nationalId ? new KenyanNationalId(data.nationalId) : undefined,
    nationalIdVerified: data.nationalIdVerified || false,
    birthCertificateNumber: data.birthCertificateNumber,
    primaryPhone: data.primaryPhone,
    email: data.email,
    tribe: data.tribe,
    religion: data.religion,
    referenceCreatedAt: new Date(data.referenceCreatedAt),
    verificationStatus: data.verificationStatus,
    lastVerifiedAt: data.lastVerifiedAt ? new Date(data.lastVerifiedAt) : undefined,
  };

  return new FamilyMemberReferenceVO(props);
}
