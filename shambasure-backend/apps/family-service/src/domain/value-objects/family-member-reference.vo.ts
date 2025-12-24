// src/domain/value-objects/family-member-reference.vo.ts
import { ValueObject } from '../base/value-object';
import { Gender } from './family-enums.vo';
import { KenyanNationalId } from './kenyan-identity.vo';
import { PersonName } from './person-name.vo';

/**
 * FamilyMemberReferenceVO - Immutable reference to a FamilyMember
 *
 * Purpose: Cross-aggregate reference with validated identity data
 * Principles: Immutable, self-validating, no business logic
 * Kenyan Context: Validates Kenyan identity formats and ages
 */
export interface FamilyMemberReferenceProps {
  // Required Identity
  memberId: string; // ID from Family aggregate
  fullName: PersonName; // Name object
  dateOfBirth: Date; // For age verification
  gender: Gender; // Gender value

  // Life Status
  isAlive: boolean; // Living status
  isMinor: boolean; // Calculated at creation: < 18 years

  // Kenyan Identity Verification
  nationalId?: KenyanNationalId;
  nationalIdVerified: boolean;
  birthCertificateNumber?: string;

  // Contact Info
  primaryPhone?: string;
  email?: string;

  // Cultural Context
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
  // 🔍 VALIDATION ONLY - No Business Logic
  // ---------------------------------------------------------------------------

  protected validate(): void {
    this.validateMemberId();
    this.validateDateOfBirth();
    this.validateAgeConsistency();
    this.validatePhoneNumber();
    this.validateVerification();
  }

  private validateMemberId(): void {
    if (!this.props.memberId || this.props.memberId.trim().length === 0) {
      throw new Error('Member ID is required');
    }

    if (this.props.memberId.length > 50) {
      throw new Error('Member ID is too long');
    }
  }

  private validateDateOfBirth(): void {
    if (!this.props.dateOfBirth) {
      throw new Error('Date of birth is required');
    }

    if (this.props.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    // Reasonable age range (0-120 years)
    const age = FamilyMemberReferenceVO.calculateAge(this.props.dateOfBirth);
    if (age < 0 || age > 120) {
      throw new Error('Date of birth results in unreasonable age');
    }
  }

  private validateAgeConsistency(): void {
    const age = FamilyMemberReferenceVO.calculateAge(this.props.dateOfBirth);
    const isMinor = age < 18;

    if (this.props.isMinor !== isMinor) {
      throw new Error('isMinor flag does not match calculated age');
    }
  }

  private validatePhoneNumber(): void {
    if (!this.props.primaryPhone) return;

    // Basic Kenyan phone validation
    const phone = this.props.primaryPhone.replace(/\D/g, '');

    if (phone.length < 10) {
      throw new Error('Phone number is too short');
    }

    if (!phone.startsWith('254') && !phone.startsWith('07')) {
      throw new Error('Invalid Kenyan phone number format');
    }
  }

  private validateVerification(): void {
    if (this.props.nationalIdVerified && !this.props.nationalId) {
      throw new Error('National ID must exist if marked as verified');
    }

    if (this.props.verificationStatus === 'VERIFIED' && !this.props.nationalIdVerified) {
      throw new Error('Verification status inconsistent with national ID verification');
    }

    if (this.props.lastVerifiedAt && this.props.lastVerifiedAt > new Date()) {
      throw new Error('Last verified date cannot be in the future');
    }
  }

  // ---------------------------------------------------------------------------
  // 🏭 FACTORY METHODS (Pure creation, no logic)
  // ---------------------------------------------------------------------------

  public static create(props: {
    memberId: string;
    fullName: PersonName;
    dateOfBirth: Date;
    gender: Gender;
    isAlive: boolean;
    nationalId?: KenyanNationalId;
    nationalIdVerified?: boolean;
    birthCertificateNumber?: string;
    primaryPhone?: string;
    email?: string;
    tribe?: string;
    religion?: string;
    verificationStatus?: 'UNVERIFIED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REJECTED';
    lastVerifiedAt?: Date;
  }): FamilyMemberReferenceVO {
    const age = FamilyMemberReferenceVO.calculateAge(props.dateOfBirth);
    const isMinor = age < 18;

    const voProps: FamilyMemberReferenceProps = {
      memberId: props.memberId,
      fullName: props.fullName,
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      isAlive: props.isAlive,
      isMinor,
      nationalId: props.nationalId,
      nationalIdVerified: props.nationalIdVerified || false,
      birthCertificateNumber: props.birthCertificateNumber,
      primaryPhone: props.primaryPhone,
      email: props.email,
      tribe: props.tribe,
      religion: props.religion,
      referenceCreatedAt: new Date(),
      verificationStatus: props.verificationStatus || 'UNVERIFIED',
      lastVerifiedAt: props.lastVerifiedAt,
    };

    return new FamilyMemberReferenceVO(voProps);
  }

  public static createForNewborn(props: {
    memberId: string;
    fullName: PersonName;
    dateOfBirth: Date;
    gender: Gender;
    parentPhone: string;
  }): FamilyMemberReferenceVO {
    const ageInDays = (new Date().getTime() - props.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 180) {
      throw new Error('Use create() for children over 6 months');
    }

    return FamilyMemberReferenceVO.create({
      memberId: props.memberId,
      fullName: props.fullName,
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      isAlive: true,
      birthCertificateNumber: `PENDING_${props.memberId}`,
      primaryPhone: props.parentPhone,
      verificationStatus: 'VERIFICATION_PENDING',
    });
  }

  // ---------------------------------------------------------------------------
  // 🧮 UTILITY METHODS (Pure calculations only)
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

  // ---------------------------------------------------------------------------
  // 🔄 IMMUTABLE UPDATES (Return new instances)
  // ---------------------------------------------------------------------------

  public updateContact(contact: {
    primaryPhone?: string;
    email?: string;
  }): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      ...contact,
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  public verifyIdentity(nationalId: KenyanNationalId): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      nationalId,
      nationalIdVerified: true,
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: new Date(),
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  public recordDeath(): FamilyMemberReferenceVO {
    const newProps: FamilyMemberReferenceProps = {
      ...this.props,
      isAlive: false,
    };

    return new FamilyMemberReferenceVO(newProps);
  }

  // ---------------------------------------------------------------------------
  // 📊 DATA ACCESS (Getters only)
  // ---------------------------------------------------------------------------

  public getDisplayName(format: 'FULL' | 'FORMAL' = 'FULL'): string {
    if (format === 'FORMAL') {
      return `${this.props.fullName.getFullName('FORMAL')}${
        this.props.nationalId ? ` (ID: ${this.props.nationalId.value})` : ''
      }`;
    }
    return this.props.fullName.getFullName();
  }

  public isAdult(atDate: Date = new Date()): boolean {
    return !this.props.isMinor && this.getAge(atDate) >= 18;
  }

  public isElderly(atDate: Date = new Date()): boolean {
    return this.getAge(atDate) >= 65;
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
      },
      verification: {
        status: this.props.verificationStatus,
        lastVerifiedAt: this.props.lastVerifiedAt,
      },
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

  public get nationalId(): KenyanNationalId | undefined {
    return this.props.nationalId;
  }

  public get nationalIdVerified(): boolean {
    return this.props.nationalIdVerified;
  }

  public get verificationStatus(): string {
    return this.props.verificationStatus;
  }
}
