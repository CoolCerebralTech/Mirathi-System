// src/family-service/src/domain/entities/family-member.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { Gender, KenyanCounty } from '../value-objects/family-enums.vo';
import { KenyanNationalId } from '../value-objects/kenyan-identity.vo';
import { KraPin } from '../value-objects/kenyan-identity.vo';
import { PersonName } from '../value-objects/person-name.vo';
import { FamilyMember, FamilyMemberProps } from './family-member.entity';

/**
 * Family Member Factory
 *
 * Innovations:
 * 1. Smart member creation with intelligent defaults
 * 2. Age estimation from ID numbers
 * 3. Cultural context auto-detection
 * 4. Batch creation for families
 * 5. Template-based creation for common patterns
 */
export class FamilyMemberFactory {
  /**
   * Create adult member with full identity
   */
  public static createAdult(
    firstName: string,
    lastName: string,
    gender: Gender,
    nationalIdNumber: string,
    createdBy: UniqueEntityID,
    options?: {
      middleName?: string;
      maidenName?: string;
      dateOfBirth?: Date;
      phoneNumber?: string;
      email?: string;
      occupation?: string;
    },
  ): FamilyMember {
    const name = new PersonName({
      firstName,
      lastName,
      middleName: options?.middleName,
      maidenName: options?.maidenName,
    });

    const nationalId = new KenyanNationalId(nationalIdNumber);

    // Estimate date of birth from national ID if not provided
    let dateOfBirth = options?.dateOfBirth;
    if (!dateOfBirth) {
      const estimatedYear = nationalId.estimateBirthYear();
      if (estimatedYear) {
        // Use June 15th as estimated birth date
        dateOfBirth = new Date(estimatedYear, 5, 15);
      }
    }

    // Detect cultural origin from name
    const culturalOrigins = name.detectCulturalOrigin();
    const tribe = culturalOrigins.length > 0 ? culturalOrigins[0] : undefined;

    const props: FamilyMemberProps = {
      name,
      nationalId,
      nationalIdVerified: false,
      gender,
      dateOfBirth,
      dateOfBirthEstimated: !options?.dateOfBirth,
      isAlive: true,
      isMissing: false,
      hasDisability: false,
      isMentallyIncapacitated: false,
      medicalConditions: [],
      languages: ['Swahili', 'English', ...this.detectLanguagesFromTribe(tribe)],
      isStudent: false,
      isHeadOfFamily: false,
      isMarried: false,
      hasChildren: false,
      initiationRitesCompleted:
        gender === Gender.MALE ? this.estimateInitiationStatus(dateOfBirth) : false,
      traditionalTitles: [],
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
      phoneNumber: options?.phoneNumber,
      email: options?.email,
      occupation: options?.occupation,
    };

    return FamilyMember.create(props);
  }

  /**
   * Create child member (under 18)
   */
  public static createChild(
    firstName: string,
    lastName: string,
    gender: Gender,
    dateOfBirth: Date,
    parents: { fatherId?: UniqueEntityID; motherId?: UniqueEntityID },
    createdBy: UniqueEntityID,
    options?: {
      middleName?: string;
      birthCertificateNumber?: string;
      school?: string;
      grade?: string;
    },
  ): FamilyMember {
    const name = new PersonName({
      firstName,
      lastName,
      middleName: options?.middleName,
    });

    const age = this.calculateAge(dateOfBirth);
    const isStudent = age >= 3 && age <= 24; // Assuming school-going age

    const props: FamilyMemberProps = {
      name,
      nationalIdVerified: false,
      gender,
      dateOfBirth,
      dateOfBirthEstimated: false,
      birthCertificateNumber: options?.birthCertificateNumber,
      isAlive: true,
      isMissing: false,
      hasDisability: false,
      isMentallyIncapacitated: false,
      medicalConditions: [],
      languages: ['Swahili', 'English'],
      isStudent,
      isHeadOfFamily: false,
      isMarried: false,
      hasChildren: false,
      initiationRitesCompleted: false,
      traditionalTitles: [],
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
      occupation: isStudent ? 'Student' : undefined,
      employer: options?.school,
    };

    if (options?.grade) {
      props.educationLevel = `Grade ${options.grade}`;
    }

    return FamilyMember.create(props);
  }

  /**
   * Create elderly member (65+)
   */
  public static createElderly(
    firstName: string,
    lastName: string,
    gender: Gender,
    nationalIdNumber: string,
    createdBy: UniqueEntityID,
    options?: {
      middleName?: string;
      maidenName?: string;
      dateOfBirth?: Date;
      hasDisability?: boolean;
      medicalConditions?: string[];
      traditionalTitle?: string;
    },
  ): FamilyMember {
    const name = new PersonName({
      firstName,
      lastName,
      middleName: options?.middleName,
      maidenName: options?.maidenName,
    });

    const nationalId = new KenyanNationalId(nationalIdNumber);
    const dateOfBirth = options?.dateOfBirth || this.estimateElderlyBirthDate(nationalId);

    // Elderly often have traditional titles
    const traditionalTitles = options?.traditionalTitle ? [options.traditionalTitle] : [];
    if (gender === Gender.MALE && !options?.traditionalTitle) {
      traditionalTitles.push('Mzee'); // Respectful term for elderly
    }

    const props: FamilyMemberProps = {
      name,
      nationalId,
      nationalIdVerified: false,
      gender,
      dateOfBirth,
      dateOfBirthEstimated: !options?.dateOfBirth,
      isAlive: true,
      isMissing: false,
      hasDisability: options?.hasDisability || false,
      isMentallyIncapacitated: false,
      medicalConditions: options?.medicalConditions || [],
      languages: ['Swahili', 'English', this.detectMotherTongueFromName(name)],
      isStudent: false,
      isHeadOfFamily: true, // Elders often head families
      isMarried: true, // Most elderly are married
      hasChildren: true, // Most elderly have children
      initiationRitesCompleted: true,
      traditionalTitles,
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    return FamilyMember.create(props);
  }

  /**
   * Create member from legacy data (migration)
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): FamilyMember {
    // Transform legacy data to modern format
    const name = new PersonName({
      firstName: legacyData.first_name || legacyData.fname || '',
      lastName: legacyData.last_name || legacyData.lname || '',
      middleName: legacyData.middle_name || legacyData.mname,
      maidenName: legacyData.maiden_name,
    });

    // Parse date from various legacy formats
    const dateOfBirth = this.parseLegacyDate(
      legacyData.dob || legacyData.date_of_birth || legacyData.birth_date,
    );

    const props: FamilyMemberProps = {
      name,
      nationalId: legacyData.id_no ? new KenyanNationalId(legacyData.id_no) : undefined,
      nationalIdVerified: legacyData.id_verified === true || legacyData.id_verified === 'YES',
      kraPin: legacyData.kra_pin ? new KraPin(legacyData.kra_pin) : undefined,
      gender: this.mapLegacyGender(legacyData.gender || legacyData.sex),
      dateOfBirth,
      dateOfBirthEstimated: legacyData.dob_estimated === true,
      placeOfBirth: legacyData.birth_place as KenyanCounty,
      religion: legacyData.religion,
      tribe: legacyData.tribe || legacyData.ethnicity,
      languages: this.parseLegacyLanguages(legacyData.languages),
      isAlive: legacyData.is_alive !== false && legacyData.deceased !== true,
      dateOfDeath: legacyData.date_of_death ? new Date(legacyData.date_of_death) : undefined,
      deathCertificateNumber: legacyData.death_cert_no,
      causeOfDeath: legacyData.cause_of_death,
      isMissing: legacyData.missing === true,
      missingSince: legacyData.missing_since ? new Date(legacyData.missing_since) : undefined,
      hasDisability: legacyData.disabled === true,
      disabilityType: legacyData.disability_type,
      disabilityPercentage: legacyData.disability_percent,
      isMentallyIncapacitated: legacyData.mental_incapacity === true,
      medicalConditions: legacyData.medical_conditions
        ? Array.isArray(legacyData.medical_conditions)
          ? legacyData.medical_conditions
          : [legacyData.medical_conditions]
        : [],
      educationLevel: legacyData.education_level,
      occupation: legacyData.occupation,
      employer: legacyData.employer,
      isStudent: legacyData.is_student === true,
      phoneNumber: legacyData.phone || legacyData.mobile,
      email: legacyData.email,
      currentResidence: legacyData.residence,
      postalAddress: legacyData.address,
      isHeadOfFamily: legacyData.is_family_head === true,
      isMarried: legacyData.marital_status === 'MARRIED',
      hasChildren: legacyData.has_children === true,
      initiationRitesCompleted: legacyData.initiated === true,
      clanRole: legacyData.clan_role,
      traditionalTitles: legacyData.titles
        ? Array.isArray(legacyData.titles)
          ? legacyData.titles
          : [legacyData.titles]
        : [],
      profilePictureUrl: legacyData.profile_pic,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      verificationNotes: legacyData.verification_notes,
      lastVerifiedAt: legacyData.last_verified ? new Date(legacyData.last_verified) : undefined,
      isArchived: legacyData.archived === true,
      archivedReason: legacyData.archive_reason,
    };

    return FamilyMember.create(props);
  }

  /**
   * Create member template for quick addition
   */
  public static createTemplate(
    templateType: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING',
    referenceMember: FamilyMember,
    _createdBy: UniqueEntityID,
  ): Partial<FamilyMemberProps> {
    const referenceProps = referenceMember.props;

    switch (templateType) {
      case 'SPOUSE':
        return {
          gender: referenceProps.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE,
          placeOfBirth: referenceProps.placeOfBirth,
          religion: referenceProps.religion,
          tribe: referenceProps.tribe,
          languages: referenceProps.languages,
          isMarried: true,
          initiationRitesCompleted: true,
        };

      case 'CHILD':
        return {
          gender: Gender.MALE, // Default to male, can be changed
          placeOfBirth: referenceProps.placeOfBirth || KenyanCounty.NAIROBI,
          religion: referenceProps.religion,
          tribe: referenceProps.tribe,
          languages: referenceProps.languages,
          isStudent: true,
          initiationRitesCompleted: false,
        };

      case 'PARENT': {
        // Estimate parent's age (30 years older than reference)
        const referenceAge = referenceMember.calculateAge() || 30;
        const parentBirthYear = new Date().getFullYear() - (referenceAge + 30);
        const estimatedDOB = new Date(parentBirthYear, 5, 15); // June 15th

        return {
          gender: Gender.MALE, // Default to father
          dateOfBirth: estimatedDOB,
          dateOfBirthEstimated: true,
          placeOfBirth: referenceProps.placeOfBirth,
          religion: referenceProps.religion,
          tribe: referenceProps.tribe,
          languages: [
            ...referenceProps.languages,
            this.detectMotherTongueFromName(referenceProps.name),
          ],
          isHeadOfFamily: true,
          isMarried: true,
          hasChildren: true,
          initiationRitesCompleted: true,
          traditionalTitles: ['Mzee'],
        };
      }

      case 'SIBLING':
        return {
          gender: referenceProps.gender,
          placeOfBirth: referenceProps.placeOfBirth,
          religion: referenceProps.religion,
          tribe: referenceProps.tribe,
          languages: referenceProps.languages,
          isStudent: referenceProps.isStudent,
          initiationRitesCompleted: referenceProps.initiationRitesCompleted,
        };

      default:
        return {};
    }
  }

  // Helper Methods
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  private static estimateInitiationStatus(dateOfBirth?: Date): boolean {
    if (!dateOfBirth) return false;
    const age = this.calculateAge(dateOfBirth);
    return age >= 13; // Traditional initiation age
  }

  private static estimateElderlyBirthDate(nationalId: KenyanNationalId): Date {
    const estimatedYear = nationalId.estimateBirthYear() || 1950;
    // Subtract 65+ years for elderly
    const elderlyYear = estimatedYear - 70;
    return new Date(elderlyYear, 5, 15); // June 15th
  }

  private static detectLanguagesFromTribe(tribe?: string): string[] {
    const tribeLanguages: Record<string, string[]> = {
      LUO: ['Dholuo'],
      KIKUYU: ['Gikuyu'],
      LUHYA: ['Luhya'],
      KAMBA: ['Kikamba'],
      KALENJIN: ['Kalenjin'],
      KISII: ['Ekegusii'],
      MERU: ['Kimeru'],
    };

    return tribeLanguages[tribe?.toUpperCase() || ''] || [];
  }

  private static detectMotherTongueFromName(name: PersonName): string {
    const origins = name.detectCulturalOrigin();
    if (origins.length > 0) {
      return this.detectLanguagesFromTribe(origins[0])[0] || '';
    }
    return '';
  }

  private static parseLegacyDate(dateString: any): Date | undefined {
    if (!dateString) return undefined;

    try {
      // Handle various date formats
      if (typeof dateString === 'number') {
        // Unix timestamp
        return new Date(dateString * 1000);
      } else if (dateString.includes('/')) {
        // DD/MM/YYYY or MM/DD/YYYY
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Assume DD/MM/YYYY for Kenyan format
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD
        return new Date(dateString);
      }

      // Fallback to Date constructor
      return new Date(dateString);
    } catch {
      return undefined;
    }
  }

  private static mapLegacyGender(legacyGender: string): Gender {
    const mapping: Record<string, Gender> = {
      M: Gender.MALE,
      F: Gender.FEMALE,
      MALE: Gender.MALE,
      FEMALE: Gender.FEMALE,
      BOY: Gender.MALE,
      GIRL: Gender.FEMALE,
      '1': Gender.MALE, // Common in legacy systems
      '2': Gender.FEMALE,
    };

    return mapping[legacyGender?.toUpperCase()] || Gender.MALE;
  }

  private static parseLegacyLanguages(languages: any): string[] {
    if (!languages) return ['Swahili', 'English'];

    if (Array.isArray(languages)) {
      return languages;
    }

    if (typeof languages === 'string') {
      return languages.split(/[,;]/).map((lang) => lang.trim());
    }

    return ['Swahili', 'English'];
  }

  private static mapLegacyVerification(status: any): FamilyMemberProps['verificationStatus'] {
    const mapping: Record<string, FamilyMemberProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'VERIFICATION_PENDING',
      REJECTED: 'REJECTED',
      YES: 'VERIFIED',
      NO: 'REJECTED',
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[status?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
