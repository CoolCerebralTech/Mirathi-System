// src/family-service/src/domain/entities/next-of-kin.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  NextOfKinAppointedEvent,
  NextOfKinContactedEvent,
  NextOfKinEmergencyTriggeredEvent,
  NextOfKinUpdatedEvent,
} from '../events/next-of-kin-events';
import { KenyanCounty, RelationshipType } from '../value-objects/family-enums.vo';

/**
 * Next of Kin Entity (Emergency Contact Management)
 *
 * Innovations:
 * 1. Multi-tiered emergency contact system (Primary, Secondary, Tertiary)
 * 2. Smart contact routing based on availability and relationship
 * 3. Legal authority mapping for emergency decisions
 * 4. Automated notification escalation protocols
 * 5. Geographic proximity optimization for emergencies
 */
export interface NextOfKinProps {
  // Core Information
  familyId: UniqueEntityID;
  designatorId: UniqueEntityID; // Person who appointed this next of kin
  nomineeId: UniqueEntityID; // Person appointed as next of kin

  // Appointment Details
  relationshipType: RelationshipType;
  appointmentDate: Date;
  appointmentReason:
    | 'EMERGENCY_CONTACT'
    | 'MEDICAL_DECISIONS'
    | 'LEGAL_REPRESENTATION'
    | 'ALL_PURPOSES';

  // Priority & Contact Sequence
  priorityLevel: 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'BACKUP';
  contactOrder: number; // 1, 2, 3, 4...
  isActive: boolean;

  // Legal Authority
  legalAuthority: {
    medicalDecisions: boolean;
    financialDecisions: boolean;
    legalRepresentation: boolean;
    funeralArrangements: boolean;
    childCustody: boolean;
  };

  // Contact Information
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  physicalAddress: string;
  county: KenyanCounty;
  proximityToDesignator:
    | 'SAME_HOUSEHOLD'
    | 'SAME_NEIGHBORHOOD'
    | 'SAME_COUNTY'
    | 'DIFFERENT_COUNTY'
    | 'DIFFERENT_COUNTRY';

  // Availability Tracking
  availabilitySchedule: {
    weekdays: string[]; // e.g., ['9AM-5PM', '7PM-10PM']
    weekends: string[];
    emergencyAvailability: 'ALWAYS' | 'WORKING_HOURS' | 'WEEKENDS_ONLY' | 'BY_APPOINTMENT';
  };

  preferredContactMethod: 'PHONE_CALL' | 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON';

  // Communication Preferences
  languagePreference: string; // e.g., 'Swahili', 'English', 'Kikuyu'
  communicationSkills: 'EXCELLENT' | 'GOOD' | 'BASIC' | 'NEEDS_TRANSLATOR';

  // Emergency Protocols
  emergencyProtocol: {
    escalationLevel: number; // When to contact this person (1 = immediate, 5 = last resort)
    notificationTriggers: string[]; // e.g., ['MEDICAL_EMERGENCY', 'FINANCIAL_CRISIS', 'LEGAL_ISSUE']
    specialInstructions: string;
  };

  // Health & Medical Context
  medicalInformationAccess: boolean;
  knowsMedicalHistory: boolean;
  bloodType?: string; // For medical emergencies
  knownAllergies?: string[];

  // Financial Authority
  financialAccessLevel: 'FULL' | 'LIMITED' | 'VIEW_ONLY' | 'NONE';
  bankAccountAccess?: boolean;
  insurancePolicyAccess?: boolean;

  // Children & Dependents
  canPickupChildren: boolean;
  schoolAuthorization: boolean;
  knowsChildrenRoutines: boolean;

  // Verification & Trust
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'PENDING_VERIFICATION' | 'DISPUTED';
  trustScore: number; // 0-100 based on factors
  lastVerifiedAt?: Date;
  verifiedBy?: UniqueEntityID;

  // Performance Tracking
  contactAttempts: number;
  successfulContacts: number;
  averageResponseTime?: number; // In minutes
  lastContactedAt?: Date;
  lastContactReason?: string;

  // Emergency History
  emergencyInvolvements: Array<{
    date: Date;
    emergencyType: string;
    responseTime: number;
    outcome: string;
  }>;

  // Document References
  authorizationDocumentId?: string; // Signed authorization form
  idCopyDocumentId?: string; // Copy of nominee's ID
  proofOfRelationshipId?: string; // Document proving relationship

  // Metadata
  notes?: string;
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;

  // Audit
  isArchived: boolean;
}

export class NextOfKin extends Entity<NextOfKinProps> {
  private static readonly EMERGENCY_RESPONSE_THRESHOLD = 30; // 30 minutes response time threshold
  private static readonly TRUST_SCORE_DECAY_DAYS = 90; // Trust score decays after 90 days without verification

  private constructor(props: NextOfKinProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Next of Kin appointment
   */
  public static create(props: NextOfKinProps, id?: UniqueEntityID): NextOfKin {
    // Validate creation invariants
    NextOfKin.validateCreation(props);

    const nextOfKin = new NextOfKin(props, id);

    // Calculate initial trust score
    if ((props as any).trustScore === undefined) {
      (nextOfKin.props as any).trustScore = nextOfKin.calculateInitialTrustScore();
    }

    // Record creation event
    nextOfKin.addDomainEvent(
      new NextOfKinAppointedEvent({
        nextOfKinId: nextOfKin.id.toString(),
        designatorId: nextOfKin.props.designatorId.toString(),
        nomineeId: nextOfKin.props.nomineeId.toString(),
        relationshipType: nextOfKin.props.relationshipType,
        priorityLevel: nextOfKin.props.priorityLevel,
        appointmentReason: nextOfKin.props.appointmentReason,
        appointedBy: nextOfKin.props.createdBy.toString(),
        timestamp: nextOfKin.createdAt,
      }),
    );

    return nextOfKin;
  }

  /**
   * Restore from persistence
   */
  public static restore(props: NextOfKinProps, id: UniqueEntityID, createdAt: Date): NextOfKin {
    return new NextOfKin(props, id, createdAt);
  }

  /**
   * Update next of kin information
   */
  public updateInformation(updates: Partial<NextOfKinProps>, updatedBy: UniqueEntityID): void {
    this.ensureNotArchived();

    const changes: Record<string, any> = {};
    const props = this.props as any;

    // Validate updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const oldValue = props[key];

        // Skip if no change
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;

        // Apply update
        props[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      props.lastUpdatedBy = updatedBy;

      // Recalculate trust score if relevant fields changed
      if (
        Object.keys(changes).some((k) =>
          [
            'verificationStatus',
            'contactAttempts',
            'successfulContacts',
            'averageResponseTime',
          ].includes(k),
        )
      ) {
        props.trustScore = this.calculateTrustScore();
      }

      this.addDomainEvent(
        new NextOfKinUpdatedEvent({
          nextOfKinId: this.id.toString(),
          designatorId: this.props.designatorId.toString(),
          nomineeId: this.props.nomineeId.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Record contact attempt
   */
  public recordContactAttempt(
    contactMethod: string,
    reason: string,
    initiatedBy: UniqueEntityID,
    details: {
      urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
      message?: string;
      expectedResponseTime?: number;
    },
  ): void {
    const props = this.props as any;
    props.contactAttempts++;
    props.lastContactedAt = new Date();
    props.lastContactReason = reason;
    props.lastUpdatedBy = initiatedBy;

    // Record contact event
    this.addDomainEvent(
      new NextOfKinContactedEvent({
        nextOfKinId: this.id.toString(),
        designatorId: this.props.designatorId.toString(),
        nomineeId: this.props.nomineeId.toString(),
        contactMethod,
        reason,
        urgency: details.urgency,
        initiatedBy: initiatedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Record successful contact
   */
  public recordSuccessfulContact(
    responseTime: number, // In minutes
    recordedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.successfulContacts++;

    // Update average response time
    if (!props.averageResponseTime) {
      props.averageResponseTime = responseTime;
    } else {
      const currentTotal = props.averageResponseTime * (props.successfulContacts - 1);
      props.averageResponseTime = (currentTotal + responseTime) / props.successfulContacts;
    }

    // Update trust score based on response time
    props.trustScore = this.calculateTrustScore();
    props.lastUpdatedBy = recordedBy;
  }

  /**
   * Trigger emergency protocol
   */
  public triggerEmergencyProtocol(
    emergencyType: string,
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    location: string,
    triggeredBy: UniqueEntityID,
  ): {
    shouldContact: boolean;
    priority: number;
    estimatedResponseTime: number;
  } {
    // Check if this next of kin should be contacted for this emergency type
    const shouldContact = this.shouldBeContactedForEmergency(emergencyType, severity);

    // Calculate priority based on multiple factors
    const priority = this.calculateEmergencyPriority(emergencyType, severity);

    // Estimate response time based on history and proximity
    const estimatedResponseTime = this.estimateResponseTime();

    if (shouldContact) {
      const props = this.props as any;
      // Record emergency involvement
      props.emergencyInvolvements.push({
        date: new Date(),
        emergencyType,
        responseTime: 0, // Will be updated when response received
        outcome: 'PENDING',
      });

      // Record emergency event
      this.addDomainEvent(
        new NextOfKinEmergencyTriggeredEvent({
          nextOfKinId: this.id.toString(),
          designatorId: this.props.designatorId.toString(),
          nomineeId: this.props.nomineeId.toString(),
          emergencyType,
          severity,
          location,
          priority,
          estimatedResponseTime,
          triggeredBy: triggeredBy.toString(),
          timestamp: new Date(),
        }),
      );
    }

    return {
      shouldContact,
      priority,
      estimatedResponseTime,
    };
  }

  /**
   * Verify next of kin identity and authorization
   */
  public verifyNextOfKin(
    verified: boolean,
    verificationMethod: 'ID_CHECK' | 'PHONE_VERIFICATION' | 'IN_PERSON_MEETING' | 'DOCUMENT_REVIEW',
    verifiedBy: UniqueEntityID,
    notes?: string,
  ): void {
    const props = this.props as any;
    props.verificationStatus = verified ? 'VERIFIED' : 'DISPUTED';
    props.lastVerifiedAt = new Date();
    props.verifiedBy = verifiedBy;
    props.notes = `${props.notes || ''}\nVerification: ${verificationMethod} - ${notes}`;
    props.lastUpdatedBy = verifiedBy;

    // Update trust score
    props.trustScore = this.calculateTrustScore();
  }

  /**
   * Update legal authority
   */
  public updateLegalAuthority(
    authority: Partial<NextOfKinProps['legalAuthority']>,
    updatedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.legalAuthority = {
      ...props.legalAuthority,
      ...authority,
    };
    props.lastUpdatedBy = updatedBy;
  }

  /**
   * Update contact information
   */
  public updateContactInformation(
    contactInfo: {
      primaryPhone?: string;
      secondaryPhone?: string;
      email?: string;
      physicalAddress?: string;
      county?: KenyanCounty;
    },
    updatedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;

    if (contactInfo.primaryPhone) props.primaryPhone = contactInfo.primaryPhone;
    if (contactInfo.secondaryPhone !== undefined) props.secondaryPhone = contactInfo.secondaryPhone;
    if (contactInfo.email !== undefined) props.email = contactInfo.email;
    if (contactInfo.physicalAddress) props.physicalAddress = contactInfo.physicalAddress;
    if (contactInfo.county) props.county = contactInfo.county;

    // Update proximity if address changed
    if (contactInfo.physicalAddress || contactInfo.county) {
      // In practice, would calculate proximity based on designator's address
      props.proximityToDesignator = this.calculateProximity();
    }

    props.lastUpdatedBy = updatedBy;
  }

  /**
   * Calculate trust score (0-100)
   */
  private calculateTrustScore(): number {
    let score = 50; // Base score

    // Verification status factor
    switch (this.props.verificationStatus) {
      case 'VERIFIED':
        score += 30;
        break;
      case 'PENDING_VERIFICATION':
        score += 10;
        break;
      case 'DISPUTED':
        score -= 20;
        break;
    }

    // Response time factor
    if (this.props.averageResponseTime) {
      if (this.props.averageResponseTime <= NextOfKin.EMERGENCY_RESPONSE_THRESHOLD) {
        score += 20;
      } else if (this.props.averageResponseTime <= 60) {
        score += 10;
      } else {
        score -= 5;
      }
    }

    // Success rate factor
    if (this.props.contactAttempts > 0) {
      const successRate = (this.props.successfulContacts / this.props.contactAttempts) * 100;
      if (successRate >= 90) score += 15;
      else if (successRate >= 70) score += 10;
      else if (successRate >= 50) score += 5;
      else score -= 10;
    }

    // Relationship factor
    const relationshipScore = this.calculateRelationshipTrustScore(this.props.relationshipType);
    score += relationshipScore;

    // Proximity factor
    const proximityScore = this.calculateProximityScore();
    score += proximityScore;

    // Time decay factor (trust decays if not verified recently)
    if (this.props.lastVerifiedAt) {
      const daysSinceVerification = Math.floor(
        (new Date().getTime() - this.props.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceVerification > NextOfKin.TRUST_SCORE_DECAY_DAYS) {
        const decayFactor = Math.min(daysSinceVerification / 365, 1); // Max 1 year decay
        score -= Math.floor(30 * decayFactor);
      }
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate initial trust score based on relationship
   */
  private calculateInitialTrustScore(): number {
    const relationshipScore = this.calculateRelationshipTrustScore(this.props.relationshipType);
    const proximityScore = this.calculateProximityScore();

    // Base score + relationship + proximity
    return Math.min(50 + relationshipScore + proximityScore, 100);
  }

  /**
   * Calculate trust score based on relationship type
   */
  private calculateRelationshipTrustScore(relationshipType: RelationshipType): number {
    const relationshipScores: Record<RelationshipType, number> = {
      [RelationshipType.SPOUSE]: 30,
      [RelationshipType.EX_SPOUSE]: -10,
      [RelationshipType.CHILD]: 20,
      [RelationshipType.ADOPTED_CHILD]: 15,
      [RelationshipType.STEPCHILD]: 10,
      [RelationshipType.PARENT]: 25,
      [RelationshipType.SIBLING]: 15,
      [RelationshipType.HALF_SIBLING]: 12,
      [RelationshipType.GRANDPARENT]: 10,
      [RelationshipType.GRANDCHILD]: 10,
      [RelationshipType.AUNT_UNCLE]: 10,
      [RelationshipType.NIECE_NEPHEW]: 8,
      [RelationshipType.COUSIN]: 5,
      [RelationshipType.GUARDIAN]: 25,
      [RelationshipType.OTHER]: 0,
    };

    return relationshipScores[relationshipType] || 0;
  }

  /**
   * Calculate proximity score
   */
  private calculateProximityScore(): number {
    const proximityScores = {
      SAME_HOUSEHOLD: 20,
      SAME_NEIGHBORHOOD: 15,
      SAME_COUNTY: 10,
      DIFFERENT_COUNTY: 5,
      DIFFERENT_COUNTRY: 0,
    };

    return proximityScores[this.props.proximityToDesignator] || 0;
  }

  /**
   * Calculate proximity based on addresses
   */
  private calculateProximity(): NextOfKinProps['proximityToDesignator'] {
    // In practice, would use geolocation to calculate distance
    // For now, return existing or default
    return this.props.proximityToDesignator || 'SAME_COUNTY';
  }

  /**
   * Check if should be contacted for specific emergency
   */
  private shouldBeContactedForEmergency(emergencyType: string, severity: string): boolean {
    // Check if emergency type is in notification triggers
    if (!this.props.emergencyProtocol.notificationTriggers.includes(emergencyType)) {
      return false;
    }

    // Check severity vs escalation level
    const severityLevels = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
    };

    const emergencyLevel = severityLevels[severity as keyof typeof severityLevels] || 4;
    return emergencyLevel <= this.props.emergencyProtocol.escalationLevel;
  }

  /**
   * Calculate emergency priority
   */
  private calculateEmergencyPriority(emergencyType: string, _severity: string): number {
    let priority = this.props.contactOrder;

    // Adjust based on trust score
    if (this.props.trustScore >= 80) priority -= 1;
    else if (this.props.trustScore <= 40) priority += 1;

    // Adjust based on availability
    const isAvailable = this.isCurrentlyAvailable();
    if (!isAvailable) priority += 2;

    // Adjust based on emergency type match with authority
    const isAuthorized = this.isAuthorizedForEmergencyType(emergencyType);
    if (!isAuthorized) priority += 1;

    return Math.max(priority, 1);
  }

  /**
   * Check if currently available based on schedule
   */
  private isCurrentlyAvailable(): boolean {
    // Check if within working hours
    if (this.props.availabilitySchedule.emergencyAvailability === 'ALWAYS') {
      return true;
    }

    // Simplified check - in practice would parse schedule strings
    return true;
  }

  /**
   * Check if authorized for specific emergency type
   */
  private isAuthorizedForEmergencyType(emergencyType: string): boolean {
    const authorityMap: Record<string, keyof NextOfKinProps['legalAuthority']> = {
      MEDICAL_EMERGENCY: 'medicalDecisions',
      FINANCIAL_CRISIS: 'financialDecisions',
      LEGAL_ISSUE: 'legalRepresentation',
      FUNERAL_ARRANGEMENTS: 'funeralArrangements',
      CHILD_CUSTODY_ISSUE: 'childCustody',
    };

    const authorityField = authorityMap[emergencyType];
    return authorityField ? this.props.legalAuthority[authorityField] : false;
  }

  /**
   * Estimate response time based on history and proximity
   */
  private estimateResponseTime(): number {
    // Base estimate on average response time
    if (this.props.averageResponseTime) {
      return this.props.averageResponseTime;
    }

    // Estimate based on proximity
    const proximityTimes = {
      SAME_HOUSEHOLD: 5, // 5 minutes
      SAME_NEIGHBORHOOD: 15,
      SAME_COUNTY: 45,
      DIFFERENT_COUNTY: 120,
      DIFFERENT_COUNTRY: 1440, // 24 hours
    };

    return proximityTimes[this.props.proximityToDesignator] || 60;
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: NextOfKinProps): void {
    // Designator and nominee cannot be the same
    if (props.designatorId.equals(props.nomineeId)) {
      throw new Error('Cannot appoint oneself as next of kin');
    }

    // Appointment date must be in the past
    if (props.appointmentDate > new Date()) {
      throw new Error('Appointment date cannot be in the future');
    }

    // Priority levels must be valid
    const validPriorities = ['PRIMARY', 'SECONDARY', 'TERTIARY', 'BACKUP'];
    if (!validPriorities.includes(props.priorityLevel)) {
      throw new Error('Invalid priority level');
    }

    // Contact order must be positive
    if (props.contactOrder < 1) {
      throw new Error('Contact order must be at least 1');
    }

    // Primary phone must be provided
    if (!props.primaryPhone || props.primaryPhone.trim().length === 0) {
      throw new Error('Primary phone number is required');
    }

    // Physical address must be provided
    if (!props.physicalAddress || props.physicalAddress.trim().length === 0) {
      throw new Error('Physical address is required');
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived next of kin: ${this.id.toString()}`);
    }
  }

  /**
   * Archive next of kin (soft delete)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Next of kin is already archived');
    }

    const props = this.props as any;
    props.isArchived = true;
    props.isActive = false;
    props.lastUpdatedBy = archivedBy;
    props.notes = `${props.notes || ''}\nArchived: ${reason}`;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Next of kin is not archived');
    }

    const props = this.props as any;
    props.isArchived = false;
    props.isActive = true;
    props.lastUpdatedBy = restoredBy;
  }

  /**
   * Activate next of kin
   */
  public activate(activatedBy: UniqueEntityID): void {
    const props = this.props as any;
    props.isActive = true;
    props.lastUpdatedBy = activatedBy;
  }

  /**
   * Deactivate next of kin
   */
  public deactivate(reason: string, deactivatedBy: UniqueEntityID): void {
    const props = this.props as any;
    props.isActive = false;
    props.lastUpdatedBy = deactivatedBy;
    props.notes = `${props.notes || ''}\nDeactivated: ${reason}`;
  }

  /**
   * Get next of kin summary for display
   */
  public getSummary(): Record<string, any> {
    return {
      id: this.id.toString(),
      designatorId: this.props.designatorId.toString(),
      nomineeId: this.props.nomineeId.toString(),
      relationshipType: this.props.relationshipType,
      priorityLevel: this.props.priorityLevel,
      contactOrder: this.props.contactOrder,
      isActive: this.props.isActive,
      trustScore: this.props.trustScore,
      verificationStatus: this.props.verificationStatus,
      contactInfo: {
        primaryPhone: this.props.primaryPhone,
        email: this.props.email,
        county: this.props.county,
        proximity: this.props.proximityToDesignator,
      },
      performance: {
        contactAttempts: this.props.contactAttempts,
        successfulContacts: this.props.successfulContacts,
        successRate:
          this.props.contactAttempts > 0
            ? ((this.props.successfulContacts / this.props.contactAttempts) * 100).toFixed(1) + '%'
            : 'N/A',
        averageResponseTime: this.props.averageResponseTime,
      },
      lastContactedAt: this.props.lastContactedAt,
      lastContactReason: this.props.lastContactReason,
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
      trustLevel: this.getTrustLevel(),
      availabilityStatus: this.getAvailabilityStatus(),
      emergencyReadiness: this.getEmergencyReadiness(),
      contactEffectiveness: this.getContactEffectiveness(),
      legalCapabilities: this.getLegalCapabilities(),
      recommendations: this.getRecommendations(),
    };
  }

  private getTrustLevel(): string {
    if (this.props.trustScore >= 90) return 'EXCELLENT';
    if (this.props.trustScore >= 75) return 'HIGH';
    if (this.props.trustScore >= 60) return 'GOOD';
    if (this.props.trustScore >= 40) return 'FAIR';
    return 'LOW';
  }

  private getAvailabilityStatus(): string {
    const isAvailable = this.isCurrentlyAvailable();

    if (!this.props.isActive) return 'INACTIVE';
    if (!isAvailable) return 'UNAVAILABLE';
    if (this.props.availabilitySchedule.emergencyAvailability === 'ALWAYS')
      return 'ALWAYS_AVAILABLE';

    return 'SCHEDULED_AVAILABILITY';
  }

  private getEmergencyReadiness(): Record<string, any> {
    return {
      responseTimeScore: this.calculateResponseTimeScore(),
      proximityScore: this.calculateProximityScore(),
      authorityScore: this.calculateAuthorityScore(),
      overallReadiness: this.calculateOverallReadiness(),
      strengths: this.identifyStrengths(),
      weaknesses: this.identifyWeaknesses(),
    };
  }

  private calculateResponseTimeScore(): number {
    if (!this.props.averageResponseTime) return 50;

    if (this.props.averageResponseTime <= 15) return 100;
    if (this.props.averageResponseTime <= 30) return 80;
    if (this.props.averageResponseTime <= 60) return 60;
    if (this.props.averageResponseTime <= 120) return 40;
    return 20;
  }

  private calculateAuthorityScore(): number {
    const authorities = Object.values(this.props.legalAuthority);
    const grantedAuthorities = authorities.filter((a) => a === true).length;
    return (grantedAuthorities / authorities.length) * 100;
  }

  private calculateOverallReadiness(): number {
    const responseTimeScore = this.calculateResponseTimeScore();
    const authorityScore = this.calculateAuthorityScore();
    const trustScore = this.props.trustScore;

    return Math.floor((responseTimeScore + authorityScore + trustScore) / 3);
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];

    if (this.props.trustScore >= 80) {
      strengths.push('High trust score');
    }

    if (this.props.averageResponseTime && this.props.averageResponseTime <= 30) {
      strengths.push('Fast response time');
    }

    if (this.props.proximityToDesignator === 'SAME_HOUSEHOLD') {
      strengths.push('Lives in same household');
    }

    if (Object.values(this.props.legalAuthority).some((a) => a)) {
      strengths.push('Has legal authority');
    }

    if (this.props.verificationStatus === 'VERIFIED') {
      strengths.push('Identity verified');
    }

    return strengths;
  }

  private identifyWeaknesses(): string[] {
    const weaknesses: string[] = [];

    if (this.props.trustScore < 50) {
      weaknesses.push('Low trust score');
    }

    if (this.props.averageResponseTime && this.props.averageResponseTime > 60) {
      weaknesses.push('Slow response time');
    }

    if (this.props.proximityToDesignator === 'DIFFERENT_COUNTRY') {
      weaknesses.push('Lives in different country');
    }

    if (!Object.values(this.props.legalAuthority).some((a) => a)) {
      weaknesses.push('No legal authority granted');
    }

    if (this.props.verificationStatus === 'UNVERIFIED') {
      weaknesses.push('Identity not verified');
    }

    if (this.props.contactAttempts === 0) {
      weaknesses.push('Never contacted');
    }

    return weaknesses;
  }

  private getContactEffectiveness(): Record<string, any> {
    return {
      successRate:
        this.props.contactAttempts > 0
          ? (this.props.successfulContacts / this.props.contactAttempts) * 100
          : 0,
      preferredMethod: this.props.preferredContactMethod,
      languageMatch: this.props.languagePreference,
      communicationSkills: this.props.communicationSkills,
      contactHistory: this.props.emergencyInvolvements.length,
    };
  }

  private getLegalCapabilities(): Record<string, any> {
    return {
      medicalAuthority: this.props.legalAuthority.medicalDecisions,
      financialAuthority: this.props.legalAuthority.financialDecisions,
      legalAuthority: this.props.legalAuthority.legalRepresentation,
      funeralAuthority: this.props.legalAuthority.funeralArrangements,
      childCustodyAuthority: this.props.legalAuthority.childCustody,
      medicalInfoAccess: this.props.medicalInformationAccess,
      financialAccessLevel: this.props.financialAccessLevel,
      childPickupAuthorization: this.props.canPickupChildren,
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.props.verificationStatus !== 'VERIFIED') {
      recommendations.push('Verify identity and authorization documents');
    }

    if (this.props.contactAttempts === 0) {
      recommendations.push('Test contact with a non-emergency message');
    }

    if (this.props.averageResponseTime && this.props.averageResponseTime > 60) {
      recommendations.push('Discuss response time expectations');
    }

    if (!Object.values(this.props.legalAuthority).some((a) => a)) {
      recommendations.push('Consider granting specific legal authorities');
    }

    if (this.props.proximityToDesignator === 'DIFFERENT_COUNTRY') {
      recommendations.push('Appoint a local backup contact');
    }

    if (this.props.trustScore < 60) {
      recommendations.push('Improve trust through regular communication');
    }

    return recommendations;
  }

  /**
   * Get next of kin for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      familyId: this.props.familyId.toString(),
      persons: {
        designatorId: this.props.designatorId.toString(),
        nomineeId: this.props.nomineeId.toString(),
      },
      appointment: {
        relationshipType: this.props.relationshipType,
        appointmentDate: this.props.appointmentDate,
        appointmentReason: this.props.appointmentReason,
        priorityLevel: this.props.priorityLevel,
        contactOrder: this.props.contactOrder,
        isActive: this.props.isActive,
      },
      legalAuthority: this.props.legalAuthority,
      contactInfo: {
        primaryPhone: this.props.primaryPhone,
        secondaryPhone: this.props.secondaryPhone,
        email: this.props.email,
        physicalAddress: this.props.physicalAddress,
        county: this.props.county,
        proximityToDesignator: this.props.proximityToDesignator,
      },
      availability: {
        schedule: this.props.availabilitySchedule,
        preferredContactMethod: this.props.preferredContactMethod,
        languagePreference: this.props.languagePreference,
        communicationSkills: this.props.communicationSkills,
      },
      emergencyProtocol: this.props.emergencyProtocol,
      medicalContext: {
        medicalInformationAccess: this.props.medicalInformationAccess,
        knowsMedicalHistory: this.props.knowsMedicalHistory,
        bloodType: this.props.bloodType,
        knownAllergies: this.props.knownAllergies,
      },
      financialContext: {
        financialAccessLevel: this.props.financialAccessLevel,
        bankAccountAccess: this.props.bankAccountAccess,
        insurancePolicyAccess: this.props.insurancePolicyAccess,
      },
      childrenContext: {
        canPickupChildren: this.props.canPickupChildren,
        schoolAuthorization: this.props.schoolAuthorization,
        knowsChildrenRoutines: this.props.knowsChildrenRoutines,
      },
      verification: {
        status: this.props.verificationStatus,
        trustScore: this.props.trustScore,
        lastVerifiedAt: this.props.lastVerifiedAt,
        verifiedBy: this.props.verifiedBy?.toString(),
      },
      performance: {
        contactAttempts: this.props.contactAttempts,
        successfulContacts: this.props.successfulContacts,
        averageResponseTime: this.props.averageResponseTime,
        lastContactedAt: this.props.lastContactedAt,
        lastContactReason: this.props.lastContactReason,
        emergencyInvolvements: this.props.emergencyInvolvements,
      },
      documents: {
        authorizationDocumentId: this.props.authorizationDocumentId,
        idCopyDocumentId: this.props.idCopyDocumentId,
        proofOfRelationshipId: this.props.proofOfRelationshipId,
      },
      computedProperties: this.computedProperties,
      audit: {
        createdBy: this.props.createdBy.toString(),
        lastUpdatedBy: this.props.lastUpdatedBy.toString(),
        notes: this.props.notes,
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
