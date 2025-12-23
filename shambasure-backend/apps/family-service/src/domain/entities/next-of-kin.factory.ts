// src/family-service/src/domain/entities/next-of-kin.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanCounty, RelationshipType } from '../value-objects/family-enums.vo';
import { NextOfKin, NextOfKinProps } from './next-of-kin.entity';

/**
 * Next of Kin Factory
 *
 * Innovations:
 * 1. Smart priority assignment based on relationship and proximity
 * 2. Automatic legal authority mapping for different roles
 * 3. Context-aware contact information validation
 * 4. Template-based creation for common scenarios
 * 5. Emergency protocol generation
 */
export class NextOfKinFactory {
  /**
   * Create primary next of kin (usually spouse or adult child)
   */
  public static createPrimaryNextOfKin(
    familyId: UniqueEntityID,
    designatorId: UniqueEntityID,
    nomineeId: UniqueEntityID,
    relationshipType: RelationshipType,
    appointmentDate: Date,
    contactInfo: {
      phone: string;
      email?: string;
      address: string;
      county: KenyanCounty;
    },
    createdBy: UniqueEntityID,
    options?: {
      medicalAuthority?: boolean;
      financialAuthority?: boolean;
      livesTogether?: boolean;
      knowsMedicalHistory?: boolean;
    },
  ): NextOfKin {
    const livesTogether = options?.livesTogether || false;

    const props: NextOfKinProps = {
      familyId,
      designatorId,
      nomineeId,
      relationshipType,
      appointmentDate,
      appointmentReason: 'ALL_PURPOSES',
      priorityLevel: 'PRIMARY',
      contactOrder: 1,
      isActive: true,
      legalAuthority: {
        medicalDecisions: options?.medicalAuthority ?? true,
        financialDecisions: options?.financialAuthority ?? true,
        legalRepresentation: true,
        funeralArrangements: true,
        childCustody: true,
      },
      primaryPhone: contactInfo.phone,
      email: contactInfo.email,
      physicalAddress: contactInfo.address,
      county: contactInfo.county,
      proximityToDesignator: livesTogether ? 'SAME_HOUSEHOLD' : 'SAME_COUNTY',
      availabilitySchedule: {
        weekdays: ['9AM-5PM', '7PM-10PM'],
        weekends: ['9AM-10PM'],
        emergencyAvailability: 'ALWAYS',
      },
      preferredContactMethod: 'PHONE_CALL',
      languagePreference: 'Swahili',
      communicationSkills: 'EXCELLENT',
      emergencyProtocol: {
        escalationLevel: 1,
        notificationTriggers: [
          'MEDICAL_EMERGENCY',
          'FINANCIAL_CRISIS',
          'LEGAL_ISSUE',
          'FUNERAL_ARRANGEMENTS',
        ],
        specialInstructions: 'Contact immediately for any emergency',
      },
      medicalInformationAccess: true,
      knowsMedicalHistory: options?.knowsMedicalHistory ?? true,
      financialAccessLevel: 'FULL',
      bankAccountAccess: true,
      insurancePolicyAccess: true,
      canPickupChildren: true,
      schoolAuthorization: true,
      knowsChildrenRoutines: true,
      verificationStatus: 'PENDING_VERIFICATION',
      trustScore: 0, // Will be calculated
      contactAttempts: 0,
      successfulContacts: 0,
      emergencyInvolvements: [],
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    return NextOfKin.create(props);
  }

  /**
   * Create secondary next of kin (sibling, parent, close friend)
   */
  public static createSecondaryNextOfKin(
    familyId: UniqueEntityID,
    designatorId: UniqueEntityID,
    nomineeId: UniqueEntityID,
    relationshipType: RelationshipType,
    appointmentDate: Date,
    contactInfo: {
      phone: string;
      email?: string;
      address: string;
      county: KenyanCounty;
    },
    createdBy: UniqueEntityID,
    options?: {
      specificAuthority?: 'MEDICAL_ONLY' | 'FINANCIAL_ONLY' | 'CHILD_CARE';
      availability?: string;
    },
  ): NextOfKin {
    const legalAuthority = {
      medicalDecisions: false,
      financialDecisions: false,
      legalRepresentation: false,
      funeralArrangements: false,
      childCustody: false,
    };

    // Set authority based on specific role
    if (options?.specificAuthority === 'MEDICAL_ONLY') {
      legalAuthority.medicalDecisions = true;
      legalAuthority.funeralArrangements = true;
    } else if (options?.specificAuthority === 'FINANCIAL_ONLY') {
      legalAuthority.financialDecisions = true;
    } else if (options?.specificAuthority === 'CHILD_CARE') {
      legalAuthority.childCustody = true;
    }

    const props: NextOfKinProps = {
      familyId,
      designatorId,
      nomineeId,
      relationshipType,
      appointmentDate,
      appointmentReason: 'EMERGENCY_CONTACT',
      priorityLevel: 'SECONDARY',
      contactOrder: 2,
      isActive: true,
      legalAuthority,
      primaryPhone: contactInfo.phone,
      email: contactInfo.email,
      physicalAddress: contactInfo.address,
      county: contactInfo.county,
      proximityToDesignator: this.estimateProximity(contactInfo.county, designatorId), // Would need designator's county
      availabilitySchedule: {
        weekdays: ['6PM-10PM'],
        weekends: ['9AM-10PM'],
        emergencyAvailability: 'ALWAYS',
      },
      preferredContactMethod: 'SMS',
      languagePreference: 'English',
      communicationSkills: 'GOOD',
      emergencyProtocol: {
        escalationLevel: 2,
        notificationTriggers: ['MEDICAL_EMERGENCY', 'FINANCIAL_CRISIS'],
        specialInstructions: 'Contact if primary next of kin is unavailable',
      },
      medicalInformationAccess: false,
      knowsMedicalHistory: false,
      financialAccessLevel: 'VIEW_ONLY',
      bankAccountAccess: false,
      insurancePolicyAccess: false,
      canPickupChildren:
        relationshipType === RelationshipType.SIBLING ||
        relationshipType === RelationshipType.PARENT,
      schoolAuthorization: false,
      knowsChildrenRoutines: false,
      verificationStatus: 'UNVERIFIED',
      trustScore: 0,
      contactAttempts: 0,
      successfulContacts: 0,
      emergencyInvolvements: [],
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    return NextOfKin.create(props);
  }

  /**
   * Create medical next of kin (specific for healthcare decisions)
   */
  public static createMedicalNextOfKin(
    familyId: UniqueEntityID,
    designatorId: UniqueEntityID,
    nomineeId: UniqueEntityID,
    relationshipType: RelationshipType,
    appointmentDate: Date,
    medicalContext: {
      knowsMedicalHistory: boolean;
      knowsAllergies: boolean;
      bloodType?: string;
      medicalBackground?: string; // e.g., 'NURSE', 'DOCTOR', 'CAREGIVER'
    },
    contactInfo: {
      phone: string;
      email?: string;
      address: string;
      county: KenyanCounty;
    },
    createdBy: UniqueEntityID,
  ): NextOfKin {
    const props: NextOfKinProps = {
      familyId,
      designatorId,
      nomineeId,
      relationshipType,
      appointmentDate,
      appointmentReason: 'MEDICAL_DECISIONS',
      priorityLevel: 'PRIMARY',
      contactOrder: 1,
      isActive: true,
      legalAuthority: {
        medicalDecisions: true,
        financialDecisions: false,
        legalRepresentation: false,
        funeralArrangements: true,
        childCustody: false,
      },
      primaryPhone: contactInfo.phone,
      email: contactInfo.email,
      physicalAddress: contactInfo.address,
      county: contactInfo.county,
      proximityToDesignator: 'SAME_COUNTY',
      availabilitySchedule: {
        weekdays: ['9AM-5PM'],
        weekends: ['9AM-5PM'],
        emergencyAvailability: 'ALWAYS',
      },
      preferredContactMethod: 'PHONE_CALL',
      languagePreference: 'Swahili',
      communicationSkills: 'EXCELLENT',
      emergencyProtocol: {
        escalationLevel: 1,
        notificationTriggers: ['MEDICAL_EMERGENCY', 'HOSPITAL_ADMISSION', 'SURGERY_CONSENT'],
        specialInstructions: 'Contact immediately for medical emergencies',
      },
      medicalInformationAccess: true,
      knowsMedicalHistory: medicalContext.knowsMedicalHistory,
      bloodType: medicalContext.bloodType,
      knownAllergies: medicalContext.knowsAllergies ? ['KNOWN_ALLERGIES_DOCUMENTED'] : undefined,
      financialAccessLevel: 'NONE',
      bankAccountAccess: false,
      insurancePolicyAccess: true, // For medical insurance
      canPickupChildren: false,
      schoolAuthorization: false,
      knowsChildrenRoutines: false,
      verificationStatus: 'PENDING_VERIFICATION',
      trustScore: 0,
      contactAttempts: 0,
      successfulContacts: 0,
      emergencyInvolvements: [],
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    return NextOfKin.create(props);
  }

  /**
   * Create international next of kin (lives abroad)
   */
  public static createInternationalNextOfKin(
    familyId: UniqueEntityID,
    designatorId: UniqueEntityID,
    nomineeId: UniqueEntityID,
    relationshipType: RelationshipType,
    appointmentDate: Date,
    contactInfo: {
      phone: string;
      email: string;
      address: string;
      country: string;
      timezone: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      purpose?: 'FINANCIAL_SUPPORT' | 'EMERGENCY_CONTACT' | 'TRAVEL_ASSISTANCE';
      canSendFunds?: boolean;
    },
  ): NextOfKin {
    const props: NextOfKinProps = {
      familyId,
      designatorId,
      nomineeId,
      relationshipType,
      appointmentDate,
      appointmentReason: 'LEGAL_REPRESENTATION',
      priorityLevel: 'TERTIARY',
      contactOrder: 3,
      isActive: true,
      legalAuthority: {
        medicalDecisions: false,
        financialDecisions: options?.purpose === 'FINANCIAL_SUPPORT',
        legalRepresentation: true,
        funeralArrangements: false,
        childCustody: false,
      },
      primaryPhone: contactInfo.phone,
      email: contactInfo.email,
      physicalAddress: `${contactInfo.address}, ${contactInfo.country}`,
      county: KenyanCounty.NAIROBI, // Default
      proximityToDesignator: 'DIFFERENT_COUNTRY',
      availabilitySchedule: {
        weekdays: this.calculateAvailabilityBasedOnTimezone(contactInfo.timezone),
        weekends: this.calculateAvailabilityBasedOnTimezone(contactInfo.timezone, true),
        emergencyAvailability: 'BY_APPOINTMENT',
      },
      preferredContactMethod: 'WHATSAPP',
      languagePreference: 'English',
      communicationSkills: 'GOOD',
      emergencyProtocol: {
        escalationLevel: 3,
        notificationTriggers: ['FINANCIAL_CRISIS', 'LEGAL_ISSUE', 'TRAVEL_EMERGENCY'],
        specialInstructions: `Contact during ${contactInfo.country} business hours`,
      },
      medicalInformationAccess: false,
      knowsMedicalHistory: false,
      financialAccessLevel: options?.canSendFunds ? 'LIMITED' : 'NONE',
      bankAccountAccess: false,
      insurancePolicyAccess: false,
      canPickupChildren: false,
      schoolAuthorization: false,
      knowsChildrenRoutines: false,
      verificationStatus: 'PENDING_VERIFICATION',
      trustScore: 0,
      contactAttempts: 0,
      successfulContacts: 0,
      emergencyInvolvements: [],
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    return NextOfKin.create(props);
  }

  /**
   * Create next of kin from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): NextOfKin {
    const props: NextOfKinProps = {
      familyId: new UniqueEntityID(legacyData.family_id),
      designatorId: new UniqueEntityID(legacyData.designator_id),
      nomineeId: new UniqueEntityID(legacyData.nominee_id),
      relationshipType: this.mapLegacyRelationshipType(legacyData.relationship_type),
      appointmentDate: new Date(legacyData.appointment_date),
      appointmentReason: this.mapLegacyAppointmentReason(legacyData.appointment_reason),
      priorityLevel: this.mapLegacyPriority(legacyData.priority_level),
      contactOrder: legacyData.contact_order || 1,
      isActive: legacyData.is_active !== false,
      legalAuthority: {
        medicalDecisions: legacyData.medical_decisions === true,
        financialDecisions: legacyData.financial_decisions === true,
        legalRepresentation: legacyData.legal_representation === true,
        funeralArrangements: legacyData.funeral_arrangements === true,
        childCustody: legacyData.child_custody === true,
      },
      primaryPhone: legacyData.primary_phone,
      secondaryPhone: legacyData.secondary_phone,
      email: legacyData.email,
      physicalAddress: legacyData.physical_address,
      county: legacyData.county as KenyanCounty,
      proximityToDesignator: legacyData.proximity || 'SAME_COUNTY',
      availabilitySchedule: legacyData.availability_schedule || {
        weekdays: ['9AM-5PM'],
        weekends: ['9AM-5PM'],
        emergencyAvailability: 'ALWAYS',
      },
      preferredContactMethod: legacyData.preferred_contact_method || 'PHONE_CALL',
      languagePreference: legacyData.language_preference || 'Swahili',
      communicationSkills: legacyData.communication_skills || 'GOOD',
      emergencyProtocol: legacyData.emergency_protocol || {
        escalationLevel: 1,
        notificationTriggers: ['MEDICAL_EMERGENCY'],
        specialInstructions: '',
      },
      medicalInformationAccess: legacyData.medical_info_access === true,
      knowsMedicalHistory: legacyData.knows_medical_history === true,
      bloodType: legacyData.blood_type,
      knownAllergies: legacyData.known_allergies,
      financialAccessLevel: legacyData.financial_access_level || 'NONE',
      bankAccountAccess: legacyData.bank_account_access === true,
      insurancePolicyAccess: legacyData.insurance_access === true,
      canPickupChildren: legacyData.can_pickup_children === true,
      schoolAuthorization: legacyData.school_authorization === true,
      knowsChildrenRoutines: legacyData.knows_children_routines === true,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      trustScore: legacyData.trust_score || 0,
      lastVerifiedAt: legacyData.last_verified_at
        ? new Date(legacyData.last_verified_at)
        : undefined,
      verifiedBy: legacyData.verified_by ? new UniqueEntityID(legacyData.verified_by) : undefined,
      contactAttempts: legacyData.contact_attempts || 0,
      successfulContacts: legacyData.successful_contacts || 0,
      averageResponseTime: legacyData.average_response_time,
      lastContactedAt: legacyData.last_contacted_at
        ? new Date(legacyData.last_contacted_at)
        : undefined,
      lastContactReason: legacyData.last_contact_reason,
      emergencyInvolvements: legacyData.emergency_involvements || [],
      authorizationDocumentId: legacyData.authorization_doc_id,
      idCopyDocumentId: legacyData.id_copy_doc_id,
      proofOfRelationshipId: legacyData.proof_of_relationship_id,
      notes: legacyData.notes,
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: legacyData.archived === true,
    };

    return NextOfKin.create(props);
  }

  /**
   * Generate template for quick next of kin creation
   */
  public static createTemplate(
    templateType: 'PRIMARY_SPOUSE' | 'SECONDARY_SIBLING' | 'MEDICAL_CHILD' | 'INTERNATIONAL_PARENT',
    familyId: UniqueEntityID,
    designatorId: UniqueEntityID,
    nomineeId: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<NextOfKinProps> {
    const baseTemplate: Partial<NextOfKinProps> = {
      familyId,
      designatorId,
      nomineeId,
      appointmentDate: new Date(),
      isActive: true,
      verificationStatus: 'UNVERIFIED',
      trustScore: 0,
      contactAttempts: 0,
      successfulContacts: 0,
      emergencyInvolvements: [],
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    switch (templateType) {
      case 'PRIMARY_SPOUSE':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.SPOUSE,
          appointmentReason: 'ALL_PURPOSES',
          priorityLevel: 'PRIMARY',
          contactOrder: 1,
          legalAuthority: {
            medicalDecisions: true,
            financialDecisions: true,
            legalRepresentation: true,
            funeralArrangements: true,
            childCustody: true,
          },
          proximityToDesignator: 'SAME_HOUSEHOLD',
          preferredContactMethod: 'PHONE_CALL',
          medicalInformationAccess: true,
          knowsMedicalHistory: true,
          financialAccessLevel: 'FULL',
          canPickupChildren: true,
          schoolAuthorization: true,
        };

      case 'SECONDARY_SIBLING':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.SIBLING,
          appointmentReason: 'EMERGENCY_CONTACT',
          priorityLevel: 'SECONDARY',
          contactOrder: 2,
          legalAuthority: {
            medicalDecisions: false,
            financialDecisions: false,
            legalRepresentation: false,
            funeralArrangements: true,
            childCustody: false,
          },
          proximityToDesignator: 'SAME_COUNTY',
          preferredContactMethod: 'SMS',
          medicalInformationAccess: false,
          knowsMedicalHistory: false,
          financialAccessLevel: 'NONE',
          canPickupChildren: true,
          schoolAuthorization: false,
        };

      case 'MEDICAL_CHILD':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.CHILD,
          appointmentReason: 'MEDICAL_DECISIONS',
          priorityLevel: 'PRIMARY',
          contactOrder: 1,
          legalAuthority: {
            medicalDecisions: true,
            financialDecisions: false,
            legalRepresentation: false,
            funeralArrangements: true,
            childCustody: false,
          },
          proximityToDesignator: 'SAME_COUNTY',
          preferredContactMethod: 'PHONE_CALL',
          medicalInformationAccess: true,
          knowsMedicalHistory: true,
          financialAccessLevel: 'NONE',
          canPickupChildren: false,
          schoolAuthorization: false,
        };

      case 'INTERNATIONAL_PARENT':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.PARENT,
          appointmentReason: 'LEGAL_REPRESENTATION',
          priorityLevel: 'TERTIARY',
          contactOrder: 3,
          legalAuthority: {
            medicalDecisions: false,
            financialDecisions: true,
            legalRepresentation: true,
            funeralArrangements: false,
            childCustody: false,
          },
          proximityToDesignator: 'DIFFERENT_COUNTRY',
          preferredContactMethod: 'WHATSAPP',
          medicalInformationAccess: false,
          knowsMedicalHistory: false,
          financialAccessLevel: 'LIMITED',
          canPickupChildren: false,
          schoolAuthorization: false,
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static estimateProximity(
    _nomineeCounty: KenyanCounty,
    _designatorId: UniqueEntityID,
  ): NextOfKinProps['proximityToDesignator'] {
    // In practice, would fetch designator's county and compare
    // For now, return default
    return 'SAME_COUNTY';
  }

  private static calculateAvailabilityBasedOnTimezone(
    timezone: string,
    isWeekend: boolean = false,
  ): string[] {
    // Simplified timezone-based availability
    // In practice, would convert timezone to Kenyan time
    if (timezone.includes('Europe') || timezone.includes('Africa')) {
      return isWeekend ? ['9AM-5PM'] : ['9AM-5PM'];
    } else if (timezone.includes('America')) {
      return isWeekend ? ['2PM-10PM'] : ['2PM-10PM']; // Evening in Kenya
    } else if (timezone.includes('Asia') || timezone.includes('Australia')) {
      return isWeekend ? ['6AM-2PM'] : ['6AM-2PM']; // Morning in Kenya
    }

    return ['9AM-5PM'];
  }

  private static mapLegacyRelationshipType(legacyType: string): RelationshipType {
    const mapping: Record<string, RelationshipType> = {
      SPOUSE: RelationshipType.SPOUSE,
      CHILD: RelationshipType.CHILD,
      PARENT: RelationshipType.PARENT,
      SIBLING: RelationshipType.SIBLING,
      SISTER: RelationshipType.SIBLING,
      BROTHER: RelationshipType.SIBLING,
      GRANDPARENT: RelationshipType.GRANDPARENT,
      GRANDCHILD: RelationshipType.GRANDCHILD,
      AUNT: RelationshipType.AUNT_UNCLE,
      UNCLE: RelationshipType.AUNT_UNCLE,
      NIECE: RelationshipType.NIECE_NEPHEW,
      NEPHEW: RelationshipType.NIECE_NEPHEW,
      COUSIN: RelationshipType.COUSIN,
      FRIEND: RelationshipType.COUSIN, // Default to cousin for non-family
    };

    return mapping[legacyType?.toUpperCase()] || RelationshipType.COUSIN;
  }

  private static mapLegacyAppointmentReason(
    legacyReason: string,
  ): NextOfKinProps['appointmentReason'] {
    const mapping: Record<string, NextOfKinProps['appointmentReason']> = {
      EMERGENCY: 'EMERGENCY_CONTACT',
      MEDICAL: 'MEDICAL_DECISIONS',
      LEGAL: 'LEGAL_REPRESENTATION',
      ALL: 'ALL_PURPOSES',
      GENERAL: 'EMERGENCY_CONTACT',
    };

    return mapping[legacyReason?.toUpperCase()] || 'EMERGENCY_CONTACT';
  }

  private static mapLegacyPriority(legacyPriority: string): NextOfKinProps['priorityLevel'] {
    const mapping: Record<string, NextOfKinProps['priorityLevel']> = {
      PRIMARY: 'PRIMARY',
      SECONDARY: 'SECONDARY',
      TERTIARY: 'TERTIARY',
      BACKUP: 'BACKUP',
      '1': 'PRIMARY',
      '2': 'SECONDARY',
      '3': 'TERTIARY',
      '4': 'BACKUP',
    };

    return mapping[legacyPriority?.toUpperCase()] || 'SECONDARY';
  }

  private static mapLegacyVerification(legacyStatus: any): NextOfKinProps['verificationStatus'] {
    const mapping: Record<string, NextOfKinProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'PENDING_VERIFICATION',
      REJECTED: 'REJECTED',
      YES: 'VERIFIED',
      NO: 'REJECTED',
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[legacyStatus?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
