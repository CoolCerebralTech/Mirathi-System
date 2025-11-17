import { GuardianType } from '@prisma/client';
import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { GuardianUpdatedEvent } from '../events/guardian-updated.event';

export interface GuardianAppointment {
  appointedBy: string; // Will ID, court order reference, or family decision
  appointmentDate: Date;
  validUntil: Date | null;
  authority: 'PARENTAL' | 'COURT' | 'FAMILY' | 'TESTAMENTARY';
  referenceNumber?: string; // Court case number or will reference
}

export interface GuardianResponsibilities {
  financialManagement: boolean;
  healthcareDecisions: boolean;
  educationDecisions: boolean;
  propertyManagement: boolean;
  dailyCare: boolean;
  religiousUpbringing: boolean;
}

export class Guardianship {
  private id: string;
  private guardianId: string; // FamilyMember ID acting as guardian
  private wardId: string; // FamilyMember ID of the minor/dependent
  private relationship: KenyanRelationship;
  private guardianType: GuardianType;
  private appointment: GuardianAppointment;
  private responsibilities: GuardianResponsibilities;
  private isActive: boolean;
  private notes: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    guardianId: string,
    wardId: string,
    relationship: KenyanRelationship,
    guardianType: GuardianType,
    appointment: GuardianAppointment,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (guardianId === wardId) {
      throw new Error('Guardian cannot be the same person as the ward');
    }

    this.validateAppointment(appointment);

    this.id = id;
    this.guardianId = guardianId;
    this.wardId = wardId;
    this.relationship = relationship;
    this.guardianType = guardianType;
    this.appointment = { ...appointment };
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
    this.responsibilities = this.getDefaultResponsibilities(guardianType);
    this.isActive = true;
    this.notes = null;
  }

  // Getters
  getId(): string { return this.id; }
  getGuardianId(): string { return this.guardianId; }
  getWardId(): string { return this.wardId; }
  getRelationship(): KenyanRelationship { return this.relationship; }
  getGuardianType(): GuardianType { return this.guardianType; }
  getAppointment(): Readonly<GuardianAppointment> { return { ...this.appointment }; }
  getResponsibilities(): Readonly<GuardianResponsibilities> { return { ...this.responsibilities }; }
  getIsActive(): boolean { return this.isActive; }
  getNotes(): string | null { return this.notes; }
  getCreatedAt(): Date { return new Date(this.createdAt); }
  getUpdatedAt(): Date { return new Date(this.updatedAt); }

  // Business methods
  updateGuardianType(guardianType: GuardianType): void {
    this.guardianType = guardianType;
    this.responsibilities = this.getDefaultResponsibilities(guardianType);
    this.updatedAt = new Date();

    // Apply domain event
    // this.apply(new GuardianUpdatedEvent(this.id, this.guardianId, this.wardId));
  }

  updateResponsibilities(responsibilities: Partial<GuardianResponsibilities>): void {
    this.responsibilities = { ...this.responsibilities, ...responsibilities };
    this.updatedAt = new Date();

    // Apply domain event
    // this.apply(new GuardianUpdatedEvent(this.id, this.guardianId, this.wardId));
  }

  extendAppointment(newValidUntil: Date): void {
    if (!this.isActive) {
      throw new Error('Cannot extend appointment of an inactive guardianship');
    }

    if (newValidUntil <= new Date()) {
      throw new Error('New validity date must be in the future');
    }

    this.appointment.validUntil = newValidUntil;
    this.updatedAt = new Date();
  }

  updateAppointmentDetails(appointment: Partial<GuardianAppointment>): void {
    if (appointment.appointedBy !== undefined) {
      this.appointment.appointedBy = appointment.appointedBy;
    }

    if (appointment.authority !== undefined) {
      this.appointment.authority = appointment.authority;
    }

    if (appointment.referenceNumber !== undefined) {
      this.appointment.referenceNumber = appointment.referenceNumber;
    }

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

  terminate(terminationDate: Date, reason: string): void {
    if (!this.isActive) {
      throw new Error('Guardianship is already terminated');
    }

    if (terminationDate > new Date()) {
      throw new Error('Termination date cannot be in the future');
    }

    if (terminationDate < this.appointment.appointmentDate) {
      throw new Error('Termination date cannot be before appointment date');
    }

    this.isActive = false;
    this.appointment.validUntil = terminationDate;
    this.addNotes(`Guardianship terminated on ${terminationDate.toISOString().split('T')[0]}. Reason: ${reason}`);
    this.updatedAt = new Date();
  }

  reactivate(reactivationDate: Date, reason: string): void {
    if (this.isActive) {
      throw new Error('Guardianship is already active');
    }

    if (reactivationDate > new Date()) {
      throw new Error('Reactivation date cannot be in the future');
    }

    this.isActive = true;
    this.appointment.validUntil = null; // Reset validity
    this.addNotes(`Guardianship reactivated on ${reactivationDate.toISOString().split('T')[0]}. Reason: ${reason}`);
    this.updatedAt = new Date();
  }

  // Kenyan guardianship specific methods
  isCourtAppointed(): boolean {
    return this.appointment.authority === 'COURT';
  }

  isTestamentary(): boolean {
    return this.appointment.authority === 'TESTAMENTARY';
  }

  isFamilyAppointed(): boolean {
    return this.appointment.authority === 'FAMILY';
  }

  isExpired(): boolean {
    if (!this.appointment.validUntil) {
      return false;
    }
    return new Date() > this.appointment.validUntil;
  }

  requiresCourtSupervision(): boolean {
    return this.isCourtAppointed() || 
           this.guardianType === GuardianType.LEGAL_GUARDIAN ||
           this.responsibilities.propertyManagement;
  }

  getRemainingTerm(): { years: number; months: number; days: number } | null {
    if (!this.appointment.validUntil || !this.isActive) {
      return null;
    }

    const now = new Date();
    const validUntil = new Date(this.appointment.validUntil);
    
    if (validUntil <= now) {
      return { years: 0, months: 0, days: 0 };
    }

    let years = validUntil.getFullYear() - now.getFullYear();
    let months = validUntil.getMonth() - now.getMonth();
    let days = validUntil.getDate() - now.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  validateForKenyanLaw(): { isValid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if guardian is of legal age (18+)
    // This would require checking the guardian's age from their profile
    // For now, we assume validation happens elsewhere

    // Check if ward is actually a minor or dependent
    // This would require checking the ward's status
    // For now, we assume validation happens elsewhere

    // Court-appointed guardianships require proper documentation
    if (this.isCourtAppointed() && !this.appointment.referenceNumber) {
      issues.push('Court-appointed guardianship missing case reference number');
      recommendations.push('Provide court case number for legal validation');
    }

    // Testamentary guardianships require will reference
    if (this.isTestamentary() && !this.appointment.referenceNumber) {
      issues.push('Testamentary guardianship missing will reference');
      recommendations.push('Reference the will that appoints this guardian');
    }

    // Check if guardianship duration is reasonable
    if (this.appointment.validUntil) {
      const appointmentDate = new Date(this.appointment.appointmentDate);
      const validUntil = new Date(this.appointment.validUntil);
      const maxDuration = 18; // Maximum years for minor guardianship

      const durationYears = validUntil.getFullYear() - appointmentDate.getFullYear();
      if (durationYears > maxDuration) {
        issues.push(`Guardianship duration (${durationYears} years) exceeds reasonable maximum`);
        recommendations.push('Consider periodic court review for long-term guardianships');
      }
    }

    // Financial guardianships require additional safeguards
    if (this.responsibilities.financialManagement || this.responsibilities.propertyManagement) {
      recommendations.push('Consider requiring financial bonds or regular accounting for financial guardianships');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  getLegalRequirements(): string[] {
    const requirements: string[] = [];

    if (this.isCourtAppointed()) {
      requirements.push('Court order must be presented when acting on behalf of ward');
      requirements.push('Annual reporting to the court may be required');
    }

    if (this.isTestamentary()) {
      requirements.push('Will must be probated for guardianship to take effect');
      requirements.push('Guardian must accept appointment in writing');
    }

    if (this.responsibilities.financialManagement) {
      requirements.push('Separate bank account required for ward\'s funds');
      requirements.push('Annual financial accounting may be required');
    }

    if (this.responsibilities.healthcareDecisions) {
      requirements.push('Medical consent forms should be available');
      requirements.push('Emergency contact information must be up to date');
    }

    if (this.responsibilities.propertyManagement) {
      requirements.push('Court approval may be required for major property transactions');
      requirements.push('Property must be maintained for ward\'s benefit');
    }

    return requirements;
  }

  // Validation methods
  private validateAppointment(appointment: GuardianAppointment): void {
    if (appointment.appointmentDate > new Date()) {
      throw new Error('Appointment date cannot be in the future');
    }

    if (appointment.validUntil && appointment.validUntil <= appointment.appointmentDate) {
      throw new Error('Valid until date must be after appointment date');
    }

    // Court appointments require reference numbers
    if (appointment.authority === 'COURT' && !appointment.referenceNumber) {
      throw new Error('Court-appointed guardianships require a reference number');
    }

    // Testamentary appointments require reference to will
    if (appointment.authority === 'TESTAMENTARY' && !appointment.referenceNumber) {
      throw new Error('Testamentary guardianships require a will reference');
    }
  }

  private getDefaultResponsibilities(guardianType: GuardianType): GuardianResponsibilities {
    const defaultResponsibilities: Record<GuardianType, GuardianResponsibilities> = {
      [GuardianType.LEGAL_GUARDIAN]: {
        financialManagement: true,
        healthcareDecisions: true,
        educationDecisions: true,
        propertyManagement: true,
        dailyCare: true,
        religiousUpbringing: true
      },
      [GuardianType.FINANCIAL_GUARDIAN]: {
        financialManagement: true,
        healthcareDecisions: false,
        educationDecisions: false,
        propertyManagement: true,
        dailyCare: false,
        religiousUpbringing: false
      },
      [GuardianType.PROPERTY_GUARDIAN]: {
        financialManagement: false,
        healthcareDecisions: false,
        educationDecisions: false,
        propertyManagement: true,
        dailyCare: false,
        religiousUpbringing: false
      },
      [GuardianType.TESTAMENTARY]: {
        financialManagement: true,
        healthcareDecisions: true,
        educationDecisions: true,
        propertyManagement: true,
        dailyCare: true,
        religiousUpbringing: true
      }
    };

    return { ...defaultResponsibilities[guardianType] };
  }

  // Static factory methods
  static createCourtAppointed(
    id: string,
    guardianId: string,
    wardId: string,
    relationship: KenyanRelationship,
    guardianType: GuardianType,
    courtCaseNumber: string,
    appointmentDate: Date = new Date(),
    validUntil?: Date
  ): Guardianship {
    const appointment: GuardianAppointment = {
      appointedBy: `Court Case ${courtCaseNumber}`,
      appointmentDate,
      validUntil: validUntil || null,
      authority: 'COURT',
      referenceNumber: courtCaseNumber
    };

    const guardianship = new Guardianship(id, guardianId, wardId, relationship, guardianType, appointment);
    
    // Apply domain event
    // guardianship.apply(new GuardianAssignedEvent(id, guardianId, wardId, guardianType));
    
    return guardianship;
  }

  static createTestamentary(
    id: string,
    guardianId: string,
    wardId: string,
    relationship: KenyanRelationship,
    guardianType: GuardianType,
    willReference: string,
    appointmentDate: Date = new Date()
  ): Guardianship {
    const appointment: GuardianAppointment = {
      appointedBy: `Will ${willReference}`,
      appointmentDate,
      validUntil: null, // Typically until ward reaches majority age
      authority: 'TESTAMENTARY',
      referenceNumber: willReference
    };

    const guardianship = new Guardianship(id, guardianId, wardId, relationship, guardianType, appointment);
    
    // Apply domain event
    // guardianship.apply(new GuardianAssignedEvent(id, guardianId, wardId, guardianType));
    
    return guardianship;
  }

  static createFamilyAppointed(
    id: string,
    guardianId: string,
    wardId: string,
    relationship: KenyanRelationship,
    guardianType: GuardianType,
    appointedBy: string, // Family head or committee
    appointmentDate: Date = new Date(),
    validUntil?: Date
  ): Guardianship {
    const appointment: GuardianAppointment = {
      appointedBy,
      appointmentDate,
      validUntil: validUntil || null,
      authority: 'FAMILY'
    };

    const guardianship = new Guardianship(id, guardianId, wardId, relationship, guardianType, appointment);
    
    // Apply domain event
    // guardianship.apply(new GuardianAssignedEvent(id, guardianId, wardId, guardianType));
    
    return guardianship;
  }

  static createParental(
    id: string,
    guardianId: string,
    wardId: string,
    relationship: KenyanRelationship,
    appointmentDate: Date = new Date()
  ): Guardianship {
    const appointment: GuardianAppointment = {
      appointedBy: 'Natural Parent',
      appointmentDate,
      validUntil: null, // Until child reaches majority
      authority: 'PARENTAL'
    };

    const guardianship = new Guardianship(
      id, 
      guardianId, 
      wardId, 
      relationship, 
      GuardianType.LEGAL_GUARDIAN, 
      appointment
    );
    
    // Apply domain event
    // guardianship.apply(new GuardianAssignedEvent(id, guardianId, wardId, GuardianType.LEGAL_GUARDIAN));
    
    return guardianship;
  }
}