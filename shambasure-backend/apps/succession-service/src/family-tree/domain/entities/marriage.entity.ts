import { MarriageStatus } from '@prisma/client';
import { KenyanMarriage } from '../value-objects/kenyan-marriage.vo';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { MarriageDissolvedEvent } from '../events/marriage-dissolved.event';

export class Marriage {
  private id: string;
  private familyId: string;
  private spouse1Id: string;
  private spouse2Id: string;
  private marriageDetails: KenyanMarriage;
  private divorceDate: Date | null;
  private divorceCertNumber: string | null;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDetails: KenyanMarriage,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (spouse1Id === spouse2Id) {
      throw new Error('A person cannot marry themselves');
    }

    this.id = id;
    this.familyId = familyId;
    this.spouse1Id = spouse1Id;
    this.spouse2Id = spouse2Id;
    this.marriageDetails = marriageDetails;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
    this.divorceDate = null;
    this.divorceCertNumber = null;
    this.isActive = true;
  }

  // Getters
  getId(): string { return this.id; }
  getFamilyId(): string { return this.familyId; }
  getSpouse1Id(): string { return this.spouse1Id; }
  getSpouse2Id(): string { return this.spouse2Id; }
  getMarriageDetails(): KenyanMarriage { return this.marriageDetails; }
  getDivorceDate(): Date | null { return this.divorceDate ? new Date(this.divorceDate) : null; }
  getDivorceCertNumber(): string | null { return this.divorceCertNumber; }
  getIsActive(): boolean { return this.isActive; }
  getCreatedAt(): Date { return new Date(this.createdAt); }
  getUpdatedAt(): Date { return new Date(this.updatedAt); }

  // Business methods
  updateMarriageDetails(marriageDetails: KenyanMarriage): void {
    if (!this.isActive) {
      throw new Error('Cannot update details of a dissolved marriage');
    }

    this.marriageDetails = marriageDetails;
    this.updatedAt = new Date();
  }

  dissolve(divorceDate: Date, divorceCertNumber?: string): void {
    if (!this.isActive) {
      throw new Error('Marriage is already dissolved');
    }

    if (divorceDate > new Date()) {
      throw new Error('Divorce date cannot be in the future');
    }

    const marriageDate = this.marriageDetails.getMarriageDate();
    if (divorceDate < marriageDate) {
      throw new Error('Divorce date cannot be before marriage date');
    }

    this.divorceDate = divorceDate;
    this.divorceCertNumber = divorceCertNumber || null;
    this.isActive = false;
    this.updatedAt = new Date();

    // Apply domain event
    // Note: We need to import the event and use apply method if extending AggregateRoot
    // For now, we'll assume events are handled elsewhere
  }

  restore(): void {
    if (this.isActive) {
      throw new Error('Marriage is already active');
    }

    this.divorceDate = null;
    this.divorceCertNumber = null;
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Kenyan marriage specific methods
  isCustomaryMarriage(): boolean {
    return this.marriageDetails.isCustomaryMarriage();
  }

  isCivilMarriage(): boolean {
    return this.marriageDetails.isCivilMarriage();
  }

  isPolygamous(): boolean {
    return this.marriageDetails.isPolygamous();
  }

  isLegallyRecognized(): boolean {
    return this.marriageDetails.isLegallyRecognized();
  }

  getMarriageDuration(): { years: number; months: number; days: number } | null {
    if (!this.isActive && this.divorceDate) {
      // Calculate duration until divorce
      const endDate = new Date(this.divorceDate);
      const startDate = this.marriageDetails.getMarriageDate();
      return this.calculateDuration(startDate, endDate);
    } else if (this.isActive) {
      // Calculate current duration
      const endDate = new Date();
      const startDate = this.marriageDetails.getMarriageDate();
      return this.calculateDuration(startDate, endDate);
    }
    return null;
  }

  isLongTermMarriage(): boolean {
    const duration = this.getMarriageDuration();
    return duration ? duration.years >= 10 : false;
  }

  hasProducedChildren(): boolean {
    // This would be determined by checking for children in the family tree
    // For now, return false as a placeholder
    return false;
  }

  getSuccessionRights(): string[] {
    const rights: string[] = [];

    if (this.isActive && this.isLegallyRecognized()) {
      rights.push('Right to inherit from spouse under Law of Succession Act');
      rights.push('Right to matrimonial property');
      rights.push('Right to spousal maintenance if dependent');
    }

    if (this.isLongTermMarriage()) {
      rights.push('Enhanced property rights in case of separation');
    }

    if (this.isCustomaryMarriage() && this.isLegallyRecognized()) {
      rights.push('Recognition under both customary and statutory law');
    }

    if (this.isPolygamous()) {
      rights.push('Equal succession rights with other spouses');
    }

    return rights;
  }

  validateForSuccession(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.isLegallyRecognized()) {
      issues.push('Marriage is not legally recognized - may affect succession rights');
    }

    if (!this.isActive) {
      issues.push('Marriage is dissolved - succession rights may be limited');
    }

    if (this.isCustomaryMarriage() && !this.marriageDetails.getDetails().certificateNumber) {
      issues.push('Customary marriage not registered - may require proof of marriage');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Utility methods
  private calculateDuration(startDate: Date, endDate: Date): { years: number; months: number; days: number } {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  // Static factory methods
  static createCivilMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDate: Date,
    certificateNumber: string,
    registrationOffice: string
  ): Marriage {
    const marriageDetails = KenyanMarriage.createCivilMarriage(
      marriageDate,
      certificateNumber,
      registrationOffice
    );

    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, marriageDetails);
    
    // Apply domain event
    // marriage.apply(new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id));
    
    return marriage;
  }

  static createCustomaryMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDate: Date,
    community: string,
    eldersInvolved: string[]
  ): Marriage {
    const marriageDetails = KenyanMarriage.createCustomaryMarriage(
      marriageDate,
      community,
      eldersInvolved
    );

    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, marriageDetails);
    
    // Apply domain event
    // marriage.apply(new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id));
    
    return marriage;
  }

  static createPolygamousMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDate: Date,
    marriageType: MarriageStatus
  ): Marriage {
    const marriageDetails = KenyanMarriage.createPolygamousMarriage(
      marriageDate,
      marriageType
    );

    return new Marriage(id, familyId, spouse1Id, spouse2Id, marriageDetails);
  }
}