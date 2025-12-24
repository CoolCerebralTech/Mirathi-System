// src/family-service/src/domain/entities/adoption-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  AdoptionBiologicalParentConsentEvent,
  AdoptionFinalizedEvent,
  AdoptionRevokedEvent,
  AdoptionUpdatedEvent,
} from '../events/adoption-events';
import { KenyanLawSection } from '../value-objects/family-enums.vo';

/**
 * Adoption Record Entity
 *
 * Innovations:
 * 1. Multi-type adoption support (Statutory, Customary, International, Foster-to-Adopt)
 * 2. Complete legal compliance with Children Act and Adoption Act
 * 3. Biological parent tracking with consent management
 * 4. Court order and social worker integration
 * 5. Post-adoption monitoring and reporting
 */
export interface AdoptionRecordProps {
  // Core Information
  familyId: UniqueEntityID;
  adopteeId: UniqueEntityID; // The child being adopted
  adoptiveParentId: UniqueEntityID; // Primary adoptive parent

  // Adoption Details
  adoptionType:
    | 'STATUTORY'
    | 'CUSTOMARY'
    | 'INTERNATIONAL'
    | 'KINSHIP'
    | 'FOSTER_TO_ADOPT'
    | 'STEP_PARENT'
    | 'RELATIVE';
  adoptionStatus: 'PENDING' | 'IN_PROGRESS' | 'FINALIZED' | 'REVOKED' | 'ANNULED' | 'APPEALED';

  // Dates
  applicationDate: Date;
  hearingDate?: Date;
  finalizationDate?: Date;
  effectiveDate?: Date; // When adoption becomes legally effective

  // Legal Framework
  legalBasis: KenyanLawSection[]; // Usually S. 154-165 Children Act
  courtOrderNumber?: string;
  courtStation: string;
  presidingJudge?: string;

  // Biological Parents
  biologicalMotherId?: UniqueEntityID;
  biologicalFatherId?: UniqueEntityID;
  parentalConsentStatus: {
    mother: 'CONSENTED' | 'WITHHELD' | 'UNKNOWN' | 'DECEASED' | 'TERMINATED';
    father: 'CONSENTED' | 'WITHHELD' | 'UNKNOWN' | 'DECEASED' | 'TERMINATED';
  };
  consentDocuments: string[]; // Consent affidavits, relinquishment forms

  // Social Welfare
  socialWorkerId?: string;
  socialWorkerReportId?: string;
  homeStudyReportId?: string;
  postAdoptionMonitoring: boolean;
  monitoringPeriodMonths: number;

  // Adoption Agency (if applicable)
  adoptionAgencyId?: string;
  agencySocialWorker?: string;
  agencyApprovalNumber?: string;

  // International Adoption Specific
  receivingCountry?: string;
  sendingCountry?: string;
  hagueConventionCompliant: boolean;
  immigrationDocumentId?: string;

  // Customary Adoption Specific
  clanInvolved: boolean;
  clanElders: string[];
  customaryRitesPerformed: string[];
  bridePriceConsideration?: boolean; // For adult adoption in some cultures

  // Financial Aspects
  adoptionExpenses: number;
  governmentFeesPaid: boolean;
  legalFeesPaid: boolean;
  subsidyReceived: boolean;
  subsidyAmount?: number;

  // Child Information at Adoption
  childAgeAtAdoption: number; // In months
  childSpecialNeeds: boolean;
  specialNeedsDescription?: string;
  medicalHistoryProvided: boolean;

  // Sibling Groups
  siblingGroupAdoption: boolean;
  siblingAdoptionRecordIds: UniqueEntityID[]; // Other adoption records for siblings

  // Previous Care
  previousCareArrangement: 'ORPHANAGE' | 'FOSTER_CARE' | 'RELATIVE_CARE' | 'STREET' | 'INSTITUTION';
  timeInPreviousCareMonths: number;

  // Post-Adoption Contact
  openAdoption: boolean; // Contact with biological family maintained
  contactAgreement?: string; // Terms of contact
  visitationSchedule?: string;

  // Inheritance Rights
  inheritanceRightsEstablished: boolean;
  inheritanceDocumentId?: string;

  // Citizenship & Documentation
  newBirthCertificateIssued: boolean;
  newBirthCertificateNumber?: string;
  passportIssued: boolean;
  passportNumber?: string;

  // Appeals and Challenges
  appealFiled: boolean;
  appealCaseNumber?: string;
  challengePeriodExpired: boolean; // Usually 30 days after finalization

  // Verification
  verificationStatus: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'DISPUTED';
  verificationNotes?: string;
  verifiedBy?: UniqueEntityID;
  lastVerifiedAt?: Date;

  // Metadata
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;
  isArchived: boolean;
}

export class AdoptionRecord extends Entity<AdoptionRecordProps> {
  private static readonly CHALLENGE_PERIOD_DAYS = 30;

  private constructor(props: AdoptionRecordProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }
  public getProps(): AdoptionRecordProps {
    return { ...this.props };
  }

  /**
   * Factory method to create a new Adoption Record
   */
  public static create(props: AdoptionRecordProps, id?: UniqueEntityID): AdoptionRecord {
    // Validate creation invariants
    AdoptionRecord.validateCreation(props);

    const record = new AdoptionRecord(props, id);

    // Calculate child age at adoption
    if (!props.childAgeAtAdoption) {
      // Would need child's birth date from FamilyMember
    }

    // Record creation event
    record.addDomainEvent({
      eventId: new UniqueEntityID().toString(),
      occurredAt: new Date(),
      aggregateId: record.id.toString(),
      aggregateType: 'AdoptionRecord',
      version: record.version,
      payload: {
        action: 'ADOPTION_RECORD_CREATED',
        adopteeId: record.props.adopteeId.toString(),
        adoptiveParentId: record.props.adoptiveParentId.toString(),
        adoptionType: record.props.adoptionType,
        createdBy: record.props.createdBy.toString(),
      },
    } as any);

    return record;
  }

  /**
   * Restore from persistence
   */
  public static restore(
    props: AdoptionRecordProps,
    id: UniqueEntityID,
    createdAt: Date,
  ): AdoptionRecord {
    return new AdoptionRecord(props, id, createdAt);
  }

  /**
   * Update adoption information
   */
  public updateInformation(updates: Partial<AdoptionRecordProps>, updatedBy: UniqueEntityID): void {
    this.ensureNotArchived();
    this.ensureNotFinalized(); // Can't update after finalization without court order

    const changes: Record<string, any> = {};

    // Validate updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const oldValue = (this.props as any)[key];

        // Skip if no change
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;

        // Apply update using the Entity's protected method
        (this as any)._props[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      (this as any)._props.lastUpdatedBy = updatedBy;

      this.addDomainEvent(
        new AdoptionUpdatedEvent({
          recordId: this.id.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Finalize adoption (court order received)
   */
  public finalizeAdoption(
    finalizationDate: Date,
    courtOrderNumber: string,
    courtDetails: {
      courtStation: string;
      judgeName: string;
      caseNumber: string;
    },
    finalizedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    if (this.props.adoptionStatus === 'FINALIZED') {
      throw new Error('Adoption already finalized');
    }

    if (finalizationDate < this.props.applicationDate) {
      throw new Error('Finalization date cannot be before application date');
    }

    // Validate all requirements met based on adoption type
    this.validateFinalizationRequirements();

    const previousStatus = this.props.adoptionStatus;

    // Update properties using the Entity's protected _props
    const props = this.props as any;
    props.adoptionStatus = 'FINALIZED';
    props.finalizationDate = finalizationDate;
    props.effectiveDate = finalizationDate;
    props.courtOrderNumber = courtOrderNumber;
    props.courtStation = courtDetails.courtStation;
    props.presidingJudge = courtDetails.judgeName;
    props.challengePeriodExpired = false; // Starts now
    props.lastUpdatedBy = finalizedBy;

    // Record finalization event
    this.addDomainEvent(
      new AdoptionFinalizedEvent({
        recordId: this.id.toString(),
        adopteeId: this.props.adopteeId.toString(),
        adoptiveParentId: this.props.adoptiveParentId.toString(),
        finalizationDate,
        courtOrderNumber,
        previousStatus,
        finalizedBy: finalizedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Record biological parent consent
   */
  public recordBiologicalParentConsent(
    parentType: 'MOTHER' | 'FATHER',
    consentStatus: 'CONSENTED' | 'WITHHELD' | 'TERMINATED',
    consentDocumentId: string,
    recordedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureNotFinalized();

    const props = this.props as any;

    // Update consent status
    if (parentType === 'MOTHER') {
      props.parentalConsentStatus.mother = consentStatus;
    } else {
      props.parentalConsentStatus.father = consentStatus;
    }

    // Add consent document
    props.consentDocuments.push(consentDocumentId);
    props.lastUpdatedBy = recordedBy;

    // Record consent event
    this.addDomainEvent(
      new AdoptionBiologicalParentConsentEvent({
        recordId: this.id.toString(),
        adopteeId: this.props.adopteeId.toString(),
        parentType,
        consentStatus,
        consentDocumentId,
        recordedBy: recordedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Revoke adoption (rare, but possible)
   */
  public revokeAdoption(
    revocationDate: Date,
    reason: 'FRAUD' | 'COERCION' | 'BEST_INTERESTS' | 'PARENTAL_RECLAMATION' | 'OTHER',
    courtOrderId: string,
    revokedBy: UniqueEntityID,
  ): void {
    if (this.props.adoptionStatus !== 'FINALIZED') {
      throw new Error('Only finalized adoptions can be revoked');
    }

    if (!this.props.challengePeriodExpired) {
      throw new Error('Adoption still within challenge period, use appeal instead');
    }

    const previousStatus = this.props.adoptionStatus;
    const props = this.props as any;
    props.adoptionStatus = 'REVOKED';
    props.verificationStatus = 'DISPUTED';
    props.lastUpdatedBy = revokedBy;

    // Record revocation event
    this.addDomainEvent(
      new AdoptionRevokedEvent({
        recordId: this.id.toString(),
        adopteeId: this.props.adopteeId.toString(),
        adoptiveParentId: this.props.adoptiveParentId.toString(),
        revocationDate,
        reason,
        courtOrderId,
        previousStatus,
        revokedBy: revokedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * File appeal against adoption
   */
  public fileAppeal(courtCaseNumber: string, filedBy: UniqueEntityID): void {
    if (this.props.adoptionStatus !== 'FINALIZED') {
      throw new Error('Only finalized adoptions can be appealed');
    }

    if (this.props.challengePeriodExpired) {
      throw new Error('Challenge period has expired, cannot file appeal');
    }

    const props = this.props as any;
    props.appealFiled = true;
    props.appealCaseNumber = courtCaseNumber;
    props.adoptionStatus = 'APPEALED';
    props.lastUpdatedBy = filedBy;
  }

  /**
   * Update post-adoption monitoring
   */
  public updatePostAdoptionMonitoring(reportedBy: UniqueEntityID): void {
    if (!this.props.postAdoptionMonitoring) {
      throw new Error('Post-adoption monitoring not required for this adoption');
    }

    if (this.props.adoptionStatus !== 'FINALIZED') {
      throw new Error('Only finalized adoptions have post-adoption monitoring');
    }

    // Calculate months since adoption
    const monthsSinceAdoption = this.calculateMonthsSinceAdoption();

    if (monthsSinceAdoption > this.props.monitoringPeriodMonths) {
      throw new Error('Monitoring period has ended');
    }

    // Update monitoring record
    // In practice, would create a separate monitoring entity
    (this.props as any).lastUpdatedBy = reportedBy;
  }

  /**
   * Issue new birth certificate
   */
  public issueNewBirthCertificate(certificateNumber: string, issuedBy: UniqueEntityID): void {
    if (this.props.adoptionStatus !== 'FINALIZED') {
      throw new Error('Cannot issue birth certificate for non-finalized adoption');
    }

    const props = this.props as any;
    props.newBirthCertificateIssued = true;
    props.newBirthCertificateNumber = certificateNumber;
    props.lastUpdatedBy = issuedBy;
  }

  /**
   * Check if adoption is legally valid
   */
  public isLegallyValid(): boolean {
    return (
      this.props.adoptionStatus === 'FINALIZED' &&
      this.props.courtOrderNumber !== undefined &&
      this.props.challengePeriodExpired &&
      !this.props.appealFiled
    );
  }

  /**
   * Get adoption completeness score (0-100)
   */
  public calculateCompletenessScore(): number {
    let score = 0;

    // Documentation (max 30)
    if (this.props.courtOrderNumber) score += 15;
    if (this.props.consentDocuments.length >= 2) score += 10;
    if (this.props.socialWorkerReportId) score += 5;

    // Legal status (max 30)
    if (this.props.adoptionStatus === 'FINALIZED') score += 30;
    else if (this.props.adoptionStatus === 'IN_PROGRESS') score += 20;
    else if (this.props.adoptionStatus === 'PENDING') score += 10;

    // Parental consent (max 20)
    if (this.props.parentalConsentStatus.mother === 'CONSENTED') score += 10;
    if (this.props.parentalConsentStatus.father === 'CONSENTED') score += 10;

    // Child documentation (max 20)
    if (this.props.newBirthCertificateIssued) score += 10;
    if (this.props.medicalHistoryProvided) score += 5;
    if (this.props.childSpecialNeeds && this.props.specialNeedsDescription) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get adoption type specific requirements
   */
  public getTypeSpecificRequirements(): string[] {
    const requirements: string[] = [];

    switch (this.props.adoptionType) {
      case 'STATUTORY':
        requirements.push("Court order from Children's Court");
        requirements.push('Social worker home study report');
        requirements.push(
          'Consent from biological parents or court termination of parental rights',
        );
        requirements.push('Medical examination of child');
        break;

      case 'CUSTOMARY':
        requirements.push('Clan elder approval');
        requirements.push('Customary rites performed');
        requirements.push('Community acknowledgment');
        if (this.props.bridePriceConsideration) {
          requirements.push('Bride price consideration documented');
        }
        break;

      case 'INTERNATIONAL':
        requirements.push('Hague Convention compliance certificate');
        requirements.push('Approval from Adoption Society of Kenya');
        requirements.push('Immigration clearance');
        requirements.push('Home country approval');
        break;

      case 'KINSHIP':
        requirements.push('Proof of kinship relationship');
        requirements.push('Social worker assessment');
        requirements.push('Family council approval');
        break;

      case 'FOSTER_TO_ADOPT':
        requirements.push('Minimum 6-month foster care period');
        requirements.push('Foster care assessment reports');
        requirements.push('Transition plan');
        break;

      case 'STEP_PARENT':
        requirements.push('Marriage certificate of step-parent');
        requirements.push('Consent from biological parent if applicable');
        requirements.push('Home study report');
        break;

      case 'RELATIVE':
        requirements.push('Proof of relative relationship');
        requirements.push('Family agreement document');
        requirements.push('Social worker recommendation');
        break;
    }

    return requirements;
  }

  /**
   * Check if requirements are met for finalization
   */
  public validateFinalizationRequirements(): void {
    const missingRequirements: string[] = [];

    // Check court order for statutory adoptions
    if (this.props.adoptionType === 'STATUTORY' && !this.props.courtOrderNumber) {
      missingRequirements.push('Missing court order');
    }

    // Check parental consent
    if (
      this.props.parentalConsentStatus.mother === 'WITHHELD' ||
      this.props.parentalConsentStatus.father === 'WITHHELD'
    ) {
      missingRequirements.push('Parental consent withheld');
    }

    // Check social worker report for statutory adoptions
    if (this.props.adoptionType === 'STATUTORY' && !this.props.socialWorkerReportId) {
      missingRequirements.push('Missing social worker report');
    }

    // Check clan involvement for customary adoptions
    if (this.props.adoptionType === 'CUSTOMARY' && !this.props.clanInvolved) {
      missingRequirements.push('Clan not involved in customary adoption');
    }

    // Check Hague compliance for international adoptions
    if (this.props.adoptionType === 'INTERNATIONAL' && !this.props.hagueConventionCompliant) {
      missingRequirements.push('Not Hague Convention compliant');
    }

    if (missingRequirements.length > 0) {
      throw new Error(
        `Cannot finalize adoption. Missing requirements: ${missingRequirements.join(', ')}`,
      );
    }
  }

  /**
   * Calculate months since adoption finalization
   */
  private calculateMonthsSinceAdoption(): number {
    if (!this.props.finalizationDate) return 0;

    const today = new Date();
    const finalizationDate = new Date(this.props.finalizationDate);

    let months = (today.getFullYear() - finalizationDate.getFullYear()) * 12;
    months += today.getMonth() - finalizationDate.getMonth();

    if (today.getDate() < finalizationDate.getDate()) {
      months--;
    }

    return Math.max(months, 0);
  }

  /**
   * Check if challenge period has expired
   */
  public updateChallengePeriod(): void {
    if (!this.props.finalizationDate || this.props.challengePeriodExpired) {
      return;
    }

    const challengeEndDate = new Date(this.props.finalizationDate);
    challengeEndDate.setDate(challengeEndDate.getDate() + AdoptionRecord.CHALLENGE_PERIOD_DAYS);

    if (new Date() > challengeEndDate) {
      (this.props as any).challengePeriodExpired = true;
    }
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: AdoptionRecordProps): void {
    // Adoptee and adoptive parent cannot be the same
    if (props.adopteeId.equals(props.adoptiveParentId)) {
      throw new Error('Adoptee and adoptive parent cannot be the same person');
    }

    // Application date cannot be in future
    if (props.applicationDate > new Date()) {
      throw new Error('Application date cannot be in the future');
    }

    // Finalization date must be after application date if provided
    if (props.finalizationDate && props.finalizationDate < props.applicationDate) {
      throw new Error('Finalization date cannot be before application date');
    }

    // Hearing date must be after application date if provided
    if (props.hearingDate && props.hearingDate < props.applicationDate) {
      throw new Error('Hearing date cannot be before application date');
    }

    // Child age must be reasonable (0-18 years)
    if (props.childAgeAtAdoption < 0 || props.childAgeAtAdoption > 216) {
      // 18 years in months
      throw new Error('Child age at adoption must be between 0 and 216 months (18 years)');
    }

    // Monitoring period must be reasonable (0-24 months)
    if (props.monitoringPeriodMonths < 0 || props.monitoringPeriodMonths > 24) {
      throw new Error('Monitoring period must be between 0 and 24 months');
    }

    // Adoption expenses must be positive
    if (props.adoptionExpenses < 0) {
      throw new Error('Adoption expenses cannot be negative');
    }

    // Time in previous care must be reasonable
    if (props.timeInPreviousCareMonths < 0 || props.timeInPreviousCareMonths > 240) {
      // 20 years
      throw new Error('Time in previous care must be between 0 and 240 months (20 years)');
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived adoption record: ${this.id.toString()}`);
    }
  }

  private ensureNotFinalized(): void {
    if (this.props.adoptionStatus === 'FINALIZED') {
      throw new Error(`Cannot modify finalized adoption record: ${this.id.toString()}`);
    }
  }

  /**
   * Archive adoption record (soft delete)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Adoption record is already archived');
    }

    const props = this.props as any;
    props.isArchived = true;
    props.lastUpdatedBy = archivedBy;
    props.verificationNotes = `${this.props.verificationNotes || ''}\nArchived: ${reason}`;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Adoption record is not archived');
    }

    const props = this.props as any;
    props.isArchived = false;
    props.lastUpdatedBy = restoredBy;
  }

  /**
   * Get adoption summary for display
   */
  public getSummary(): Record<string, any> {
    const completenessScore = this.calculateCompletenessScore();

    return {
      id: this.id.toString(),
      adopteeId: this.props.adopteeId.toString(),
      adoptiveParentId: this.props.adoptiveParentId.toString(),
      adoptionType: this.props.adoptionType,
      adoptionStatus: this.props.adoptionStatus,
      dates: {
        application: this.props.applicationDate,
        hearing: this.props.hearingDate,
        finalization: this.props.finalizationDate,
        effective: this.props.effectiveDate,
      },
      legal: {
        courtOrderNumber: this.props.courtOrderNumber,
        courtStation: this.props.courtStation,
        legallyValid: this.isLegallyValid(),
        challengePeriodExpired: this.props.challengePeriodExpired,
      },
      parentalConsent: this.props.parentalConsentStatus,
      childInfo: {
        ageAtAdoption: this.props.childAgeAtAdoption,
        specialNeeds: this.props.childSpecialNeeds,
        siblingGroup: this.props.siblingGroupAdoption,
      },
      completenessScore,
      verificationStatus: this.props.verificationStatus,
      isArchived: this.props.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get computed properties for business logic
   */
  public get computedProperties() {
    return {
      completenessScore: this.calculateCompletenessScore(),
      legallyValid: this.isLegallyValid(),
      typeSpecificRequirements: this.getTypeSpecificRequirements(),
      timeline: this.getTimeline(),
      legalRights: this.getLegalRights(),
      monitoringStatus: this.getMonitoringStatus(),
      appealStatus: this.getAppealStatus(),
      inheritanceAnalysis: this.getInheritanceAnalysis(),
      recommendations: this.getRecommendations(),
    };
  }

  private getTimeline(): Array<{
    date: Date;
    event: string;
    details: string;
  }> {
    const timeline: Array<{ date: Date; event: string; details: string }> = [];

    timeline.push({
      date: this.props.applicationDate,
      event: 'Adoption Application Filed',
      details: `Type: ${this.props.adoptionType}, Court: ${this.props.courtStation}`,
    });

    if (this.props.hearingDate) {
      timeline.push({
        date: this.props.hearingDate,
        event: 'Court Hearing',
        details: `Judge: ${this.props.presidingJudge || 'Not specified'}`,
      });
    }

    if (this.props.finalizationDate) {
      timeline.push({
        date: this.props.finalizationDate,
        event: 'Adoption Finalized',
        details: `Court Order: ${this.props.courtOrderNumber}`,
      });

      // Challenge period end
      const challengeEndDate = new Date(this.props.finalizationDate);
      challengeEndDate.setDate(challengeEndDate.getDate() + AdoptionRecord.CHALLENGE_PERIOD_DAYS);

      timeline.push({
        date: challengeEndDate,
        event: 'Challenge Period Ends',
        details: '30-day appeal window closes',
      });
    }

    // Add verification events
    if (this.props.lastVerifiedAt) {
      timeline.push({
        date: this.props.lastVerifiedAt,
        event: 'Record Verified',
        details: `Status: ${this.props.verificationStatus}`,
      });
    }

    // Sort by date
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getLegalRights(): Record<string, any> {
    return {
      inheritanceRights: this.props.inheritanceRightsEstablished,
      parentalRights: this.getParentalRightsStatus(),
      citizenshipRights: this.getCitizenshipRights(),
      contactRights: this.getContactRights(),
      legalPresumption: this.getLegalPresumption(),
    };
  }

  private getParentalRightsStatus(): string {
    if (this.props.adoptionStatus === 'FINALIZED') {
      return 'PARENTAL_RIGHTS_TRANSFERRED';
    }

    if (this.props.adoptionStatus === 'IN_PROGRESS') {
      return 'PARENTAL_RIGHTS_SUSPENDED';
    }

    return 'PARENTAL_RIGHTS_RETAINED';
  }

  private getCitizenshipRights(): Record<string, boolean> {
    return {
      birthCertificate: this.props.newBirthCertificateIssued,
      passport: this.props.passportIssued,
      citizenshipEstablished: this.isCitizenshipEstablished(),
    };
  }

  private isCitizenshipEstablished(): boolean {
    if (this.props.adoptionType === 'INTERNATIONAL') {
      return !!this.props.immigrationDocumentId;
    }

    return this.props.newBirthCertificateIssued;
  }

  private getContactRights(): Record<string, any> {
    return {
      openAdoption: this.props.openAdoption,
      contactAgreement: !!this.props.contactAgreement,
      visitationSchedule: !!this.props.visitationSchedule,
      biologicalParentAccess: this.getBiologicalParentAccess(),
    };
  }

  private getBiologicalParentAccess(): string {
    if (this.props.openAdoption) {
      return 'AGREED_CONTACT';
    }

    if (this.props.adoptionStatus === 'FINALIZED') {
      return 'TERMINATED';
    }

    return 'LIMITED';
  }

  private getLegalPresumption(): string {
    if (this.isLegallyValid()) {
      return 'IRREBUTTABLE_PRESUMPTION';
    }

    if (this.props.adoptionStatus === 'FINALIZED' && !this.props.challengePeriodExpired) {
      return 'REBUTTABLE_PRESUMPTION';
    }

    return 'NO_PRESUMPTION';
  }

  private getMonitoringStatus(): Record<string, any> {
    const monthsSinceAdoption = this.calculateMonthsSinceAdoption();

    return {
      required: this.props.postAdoptionMonitoring,
      periodMonths: this.props.monitoringPeriodMonths,
      monthsCompleted: monthsSinceAdoption,
      ongoing: monthsSinceAdoption <= this.props.monitoringPeriodMonths,
      nextReportDue: this.getNextReportDueDate(),
    };
  }

  private getNextReportDueDate(): Date | null {
    if (!this.props.postAdoptionMonitoring || !this.props.finalizationDate) {
      return null;
    }

    const monthsSinceAdoption = this.calculateMonthsSinceAdoption();
    const nextReportMonth = Math.floor(monthsSinceAdoption / 6) * 6 + 6; // Every 6 months

    if (nextReportMonth > this.props.monitoringPeriodMonths) {
      return null;
    }

    const nextDate = new Date(this.props.finalizationDate);
    nextDate.setMonth(nextDate.getMonth() + nextReportMonth);

    return nextDate;
  }

  private getAppealStatus(): Record<string, any> {
    return {
      appealFiled: this.props.appealFiled,
      appealCaseNumber: this.props.appealCaseNumber,
      canAppeal: this.canStillAppeal(),
      appealDeadline: this.getAppealDeadline(),
    };
  }

  private canStillAppeal(): boolean {
    return (
      this.props.adoptionStatus === 'FINALIZED' &&
      !this.props.challengePeriodExpired &&
      !this.props.appealFiled
    );
  }

  private getAppealDeadline(): Date | null {
    if (!this.props.finalizationDate || this.props.challengePeriodExpired) {
      return null;
    }

    const deadline = new Date(this.props.finalizationDate);
    deadline.setDate(deadline.getDate() + AdoptionRecord.CHALLENGE_PERIOD_DAYS);

    return deadline;
  }

  private getInheritanceAnalysis(): Record<string, any> {
    return {
      inheritanceRightsEstablished: this.props.inheritanceRightsEstablished,
      inheritanceDocumentId: this.props.inheritanceDocumentId,
      legalBasis: this.props.legalBasis,
      inheritanceStrength: this.calculateInheritanceStrength(),
      recommendations: this.getInheritanceRecommendations(),
    };
  }

  private calculateInheritanceStrength(): number {
    let strength = 0;

    if (this.props.inheritanceRightsEstablished) strength += 40;
    if (this.props.newBirthCertificateIssued) strength += 30;
    if (this.props.adoptionStatus === 'FINALIZED') strength += 30;

    return strength;
  }

  private getInheritanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.props.inheritanceRightsEstablished) {
      recommendations.push('Establish inheritance rights through court order');
    }

    if (!this.props.newBirthCertificateIssued) {
      recommendations.push('Apply for new birth certificate showing adoptive parents');
    }

    if (!this.props.inheritanceDocumentId) {
      recommendations.push('Create inheritance documentation for estate planning');
    }

    return recommendations;
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const completenessScore = this.calculateCompletenessScore();

    if (completenessScore < 80) {
      recommendations.push('Complete missing documentation for adoption record');
    }

    if (this.props.adoptionStatus === 'PENDING' && !this.props.hearingDate) {
      recommendations.push('Schedule court hearing for adoption');
    }

    if (this.props.adoptionStatus === 'IN_PROGRESS' && !this.props.socialWorkerReportId) {
      recommendations.push('Obtain social worker assessment report');
    }

    if (this.props.adoptionStatus === 'FINALIZED' && !this.props.newBirthCertificateIssued) {
      recommendations.push('Apply for amended birth certificate');
    }

    if (this.props.postAdoptionMonitoring && this.getNextReportDueDate()) {
      recommendations.push('Schedule next post-adoption monitoring report');
    }

    return recommendations;
  }

  /**
   * Get adoption for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      familyId: this.props.familyId.toString(),
      parties: {
        adopteeId: this.props.adopteeId.toString(),
        adoptiveParentId: this.props.adoptiveParentId.toString(),
        biologicalMotherId: this.props.biologicalMotherId?.toString(),
        biologicalFatherId: this.props.biologicalFatherId?.toString(),
      },
      adoption: {
        type: this.props.adoptionType,
        status: this.props.adoptionStatus,
        legalBasis: this.props.legalBasis,
      },
      timeline: {
        applicationDate: this.props.applicationDate,
        hearingDate: this.props.hearingDate,
        finalizationDate: this.props.finalizationDate,
        effectiveDate: this.props.effectiveDate,
      },
      legal: {
        courtOrderNumber: this.props.courtOrderNumber,
        courtStation: this.props.courtStation,
        presidingJudge: this.props.presidingJudge,
        challengePeriodExpired: this.props.challengePeriodExpired,
      },
      parentalConsent: {
        status: this.props.parentalConsentStatus,
        documents: this.props.consentDocuments,
      },
      socialWelfare: {
        socialWorkerId: this.props.socialWorkerId,
        socialWorkerReportId: this.props.socialWorkerReportId,
        homeStudyReportId: this.props.homeStudyReportId,
        postAdoptionMonitoring: this.props.postAdoptionMonitoring,
        monitoringPeriodMonths: this.props.monitoringPeriodMonths,
      },
      agency: {
        adoptionAgencyId: this.props.adoptionAgencyId,
        agencySocialWorker: this.props.agencySocialWorker,
        agencyApprovalNumber: this.props.agencyApprovalNumber,
      },
      international: {
        receivingCountry: this.props.receivingCountry,
        sendingCountry: this.props.sendingCountry,
        hagueConventionCompliant: this.props.hagueConventionCompliant,
        immigrationDocumentId: this.props.immigrationDocumentId,
      },
      customary: {
        clanInvolved: this.props.clanInvolved,
        clanElders: this.props.clanElders,
        customaryRitesPerformed: this.props.customaryRitesPerformed,
        bridePriceConsideration: this.props.bridePriceConsideration,
      },
      financial: {
        adoptionExpenses: this.props.adoptionExpenses,
        governmentFeesPaid: this.props.governmentFeesPaid,
        legalFeesPaid: this.props.legalFeesPaid,
        subsidyReceived: this.props.subsidyReceived,
        subsidyAmount: this.props.subsidyAmount,
      },
      childInfo: {
        ageAtAdoption: this.props.childAgeAtAdoption,
        specialNeeds: this.props.childSpecialNeeds,
        specialNeedsDescription: this.props.specialNeedsDescription,
        medicalHistoryProvided: this.props.medicalHistoryProvided,
        siblingGroupAdoption: this.props.siblingGroupAdoption,
        siblingAdoptionRecordIds: this.props.siblingAdoptionRecordIds.map((id) => id.toString()),
        previousCareArrangement: this.props.previousCareArrangement,
        timeInPreviousCareMonths: this.props.timeInPreviousCareMonths,
      },
      postAdoption: {
        openAdoption: this.props.openAdoption,
        contactAgreement: this.props.contactAgreement,
        visitationSchedule: this.props.visitationSchedule,
      },
      inheritance: {
        inheritanceRightsEstablished: this.props.inheritanceRightsEstablished,
        inheritanceDocumentId: this.props.inheritanceDocumentId,
      },
      documentation: {
        newBirthCertificateIssued: this.props.newBirthCertificateIssued,
        newBirthCertificateNumber: this.props.newBirthCertificateNumber,
        passportIssued: this.props.passportIssued,
        passportNumber: this.props.passportNumber,
      },
      appeals: {
        appealFiled: this.props.appealFiled,
        appealCaseNumber: this.props.appealCaseNumber,
      },
      computedProperties: this.computedProperties,
      verification: {
        status: this.props.verificationStatus,
        notes: this.props.verificationNotes,
        verifiedBy: this.props.verifiedBy?.toString(),
        lastVerifiedAt: this.props.lastVerifiedAt,
      },
      audit: {
        createdBy: this.props.createdBy.toString(),
        lastUpdatedBy: this.props.lastUpdatedBy.toString(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        isArchived: this.props.isArchived,
      },
      metadata: {
        version: this.version,
        isDeleted: this.isDeleted,
      },
    };
  }
}
