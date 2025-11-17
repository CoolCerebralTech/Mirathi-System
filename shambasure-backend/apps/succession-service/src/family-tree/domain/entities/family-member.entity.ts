import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  placeOfBirth?: string;
  nationalId?: string;
  passportNumber?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
  };
}

export class FamilyMember {
  private id: string;
  private userId: string | null;
  private familyId: string;
  private personalDetails: PersonalDetails;
  private contactInfo: ContactInfo;
  private relationshipTo: string | null; // "Father of John Kamau"
  private relationshipType: KenyanRelationship;
  private isMinor: boolean;
  private isDeceased: boolean;
  private notes: string | null;
  private addedBy: string;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(
    id: string,
    familyId: string,
    personalDetails: PersonalDetails,
    relationshipType: KenyanRelationship,
    addedBy: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.validatePersonalDetails(personalDetails);

    this.id = id;
    this.familyId = familyId;
    this.personalDetails = { ...personalDetails };
    this.relationshipType = relationshipType;
    this.addedBy = addedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
    this.userId = null;
    this.contactInfo = {};
    this.relationshipTo = null;
    this.isMinor = this.calculateIsMinor(personalDetails.dateOfBirth);
    this.isDeceased = !!personalDetails.dateOfDeath;
    this.notes = null;
    this.deletedAt = null;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getUserId(): string | null {
    return this.userId;
  }
  getFamilyId(): string {
    return this.familyId;
  }
  getPersonalDetails(): Readonly<PersonalDetails> {
    return { ...this.personalDetails };
  }
  getContactInfo(): Readonly<ContactInfo> {
    return { ...this.contactInfo };
  }
  getRelationshipTo(): string | null {
    return this.relationshipTo;
  }
  getRelationshipType(): KenyanRelationship {
    return this.relationshipType;
  }
  getIsMinor(): boolean {
    return this.isMinor;
  }
  getIsDeceased(): boolean {
    return this.isDeceased;
  }
  getNotes(): string | null {
    return this.notes;
  }
  getAddedBy(): string {
    return this.addedBy;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }
  getDeletedAt(): Date | null {
    return this.deletedAt ? new Date(this.deletedAt) : null;
  }

  // Business methods
  linkToUser(userId: string): void {
    if (this.userId) {
      throw new Error('Family member is already linked to a user');
    }
    this.userId = userId;
    this.updatedAt = new Date();
  }

  unlinkFromUser(): void {
    this.userId = null;
    this.updatedAt = new Date();
  }

  updatePersonalDetails(details: Partial<PersonalDetails>): void {
    if (details.firstName !== undefined) {
      if (!details.firstName.trim()) {
        throw new Error('First name cannot be empty');
      }
      this.personalDetails.firstName = details.firstName.trim();
    }

    if (details.lastName !== undefined) {
      if (!details.lastName.trim()) {
        throw new Error('Last name cannot be empty');
      }
      this.personalDetails.lastName = details.lastName.trim();
    }

    if (details.middleName !== undefined) {
      this.personalDetails.middleName = details.middleName?.trim() || undefined;
    }

    if (details.dateOfBirth !== undefined) {
      this.personalDetails.dateOfBirth = details.dateOfBirth;
      this.isMinor = this.calculateIsMinor(details.dateOfBirth);
    }

    if (details.dateOfDeath !== undefined) {
      this.personalDetails.dateOfDeath = details.dateOfDeath;
      this.isDeceased = !!details.dateOfDeath;
    }

    if (details.placeOfBirth !== undefined) {
      this.personalDetails.placeOfBirth = details.placeOfBirth?.trim() || undefined;
    }

    if (details.nationalId !== undefined) {
      this.validateKenyanId(details.nationalId);
      this.personalDetails.nationalId = details.nationalId;
    }

    if (details.passportNumber !== undefined) {
      this.personalDetails.passportNumber = details.passportNumber?.trim() || undefined;
    }

    this.updatedAt = new Date();
  }

  updateContactInfo(contactInfo: ContactInfo): void {
    this.contactInfo = { ...this.contactInfo, ...contactInfo };
    this.updatedAt = new Date();
  }

  updateRelationship(relationshipType: KenyanRelationship, relationshipTo?: string): void {
    this.relationshipType = relationshipType;
    if (relationshipTo) {
      this.relationshipTo = relationshipTo;
    }
    this.updatedAt = new Date();
  }

  setRelationshipDescription(description: string): void {
    this.relationshipTo = description;
    this.updatedAt = new Date();
  }

  addNotes(notes: string): void {
    if (!this.notes) {
      this.notes = notes;
    } else {
      this.notes += `\n\n${notes}`;
    }
    this.updatedAt = new Date();
  }

  markAsDeceased(dateOfDeath: Date, notes?: string): void {
    if (this.isDeceased) {
      throw new Error('Family member is already marked as deceased');
    }

    if (dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future');
    }

    this.personalDetails.dateOfDeath = dateOfDeath;
    this.isDeceased = true;

    if (notes) {
      this.addNotes(`Marked as deceased on ${dateOfDeath.toISOString().split('T')[0]}. ${notes}`);
    }

    this.updatedAt = new Date();
  }

  // Kenyan-specific methods
  getAge(): number | null {
    if (!this.personalDetails.dateOfBirth) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(this.personalDetails.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  isElder(): boolean {
    const age = this.getAge();
    return age !== null && age >= 60 && !this.isDeceased;
  }

  hasInheritanceRights(): boolean {
    return this.relationshipType.hasInheritanceRightsUnderIntestacy();
  }

  isDependant(): boolean {
    return this.relationshipType.isDependantUnderKenyanLaw() || this.isMinor;
  }

  requiresLegalGuardian(): boolean {
    return this.isMinor && !this.isDeceased;
  }

  getFullName(): string {
    const names = [this.personalDetails.firstName];
    if (this.personalDetails.middleName) {
      names.push(this.personalDetails.middleName);
    }
    names.push(this.personalDetails.lastName);
    return names.join(' ');
  }

  getFormattedName(): string {
    return `${this.personalDetails.lastName}, ${this.personalDetails.firstName}${
      this.personalDetails.middleName ? ` ${this.personalDetails.middleName.charAt(0)}.` : ''
    }`;
  }

  // Validation methods
  private validatePersonalDetails(details: PersonalDetails): void {
    if (!details.firstName?.trim()) {
      throw new Error('First name is required');
    }

    if (!details.lastName?.trim()) {
      throw new Error('Last name is required');
    }

    if (details.dateOfBirth && details.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    if (details.dateOfDeath && details.dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future');
    }

    if (details.dateOfBirth && details.dateOfDeath && details.dateOfDeath < details.dateOfBirth) {
      throw new Error('Date of death cannot be before date of birth');
    }

    if (details.nationalId) {
      this.validateKenyanId(details.nationalId);
    }
  }

  private validateKenyanId(id: string): void {
    // Basic Kenyan ID validation (8-9 digits)
    const idPattern = /^\d{8,9}$/;
    if (!idPattern.test(id.trim())) {
      throw new Error('Invalid Kenyan ID format. Must be 8 or 9 digits');
    }
  }

  private calculateIsMinor(dateOfBirth?: Date): boolean {
    if (!dateOfBirth) return false;

    const age = this.getAge();
    return age !== null && age < 18;
  }

  // Static factory methods
  static createForUser(
    id: string,
    familyId: string,
    userId: string,
    personalDetails: PersonalDetails,
    relationshipType: KenyanRelationship,
    addedBy: string,
  ): FamilyMember {
    const member = new FamilyMember(id, familyId, personalDetails, relationshipType, addedBy);
    member.userId = userId;
    return member;
  }

  static createForNonUser(
    id: string,
    familyId: string,
    personalDetails: PersonalDetails,
    relationshipType: KenyanRelationship,
    contactInfo: ContactInfo,
    addedBy: string,
  ): FamilyMember {
    const member = new FamilyMember(id, familyId, personalDetails, relationshipType, addedBy);
    member.contactInfo = { ...contactInfo };
    return member;
  }

  static createMinor(
    id: string,
    familyId: string,
    personalDetails: PersonalDetails,
    relationshipType: KenyanRelationship,
    addedBy: string,
    contactInfo?: ContactInfo,
  ): FamilyMember {
    const member = new FamilyMember(id, familyId, personalDetails, relationshipType, addedBy);
    if (contactInfo) {
      member.contactInfo = { ...contactInfo };
    }
    member.isMinor = true;
    return member;
  }
}
