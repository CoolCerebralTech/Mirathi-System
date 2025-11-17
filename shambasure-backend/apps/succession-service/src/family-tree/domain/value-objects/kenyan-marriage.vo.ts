import { MarriageStatus } from '@prisma/client';

export interface MarriageDetails {
  marriageDate: Date;
  marriageType: MarriageStatus;
  certificateNumber?: string;
  customaryDetails?: CustomaryMarriageDetails;
  civilDetails?: CivilMarriageDetails;
  isPolygamous: boolean;
  polygamyApproved: boolean;
}

export interface CustomaryMarriageDetails {
  community: string;
  eldersInvolved: string[];
  bridePricePaid: boolean;
  bridePriceDetails?: string;
  traditionalRitesPerformed: string[];
}

export interface CivilMarriageDetails {
  registrationOffice: string;
  marriageAct: 'CAP_150' | 'CAP_151'; // Marriage Act vs African Christian Marriage Act
  noticePeriodCompleted: boolean;
}

export class KenyanMarriage {
  private readonly details: MarriageDetails;

  constructor(details: MarriageDetails) {
    this.validateMarriageDetails(details);
    this.details = { ...details };
  }

  getDetails(): Readonly<MarriageDetails> {
    return { ...this.details };
  }

  getMarriageType(): MarriageStatus {
    return this.details.marriageType;
  }

  getMarriageDate(): Date {
    return new Date(this.details.marriageDate);
  }

  isCustomaryMarriage(): boolean {
    return [MarriageStatus.CUSTOMARY_MARRIAGE, MarriageStatus.CIVIL_UNION].includes(
      this.details.marriageType,
    );
  }

  isCivilMarriage(): boolean {
    return [MarriageStatus.MARRIED, MarriageStatus.CIVIL_UNION].includes(this.details.marriageType);
  }

  isPolygamous(): boolean {
    return this.details.isPolygamous;
  }

  isLegallyRecognized(): boolean {
    // All registered marriages are legally recognized in Kenya
    return !!this.details.certificateNumber;
  }

  // Kenyan marriage validation
  private validateMarriageDetails(details: MarriageDetails): void {
    if (details.marriageDate > new Date()) {
      throw new Error('Marriage date cannot be in the future');
    }

    // Validate customary marriage requirements
    if (details.marriageType === MarriageStatus.CUSTOMARY_MARRIAGE) {
      if (!details.customaryDetails) {
        throw new Error('Customary marriage details are required for customary marriages');
      }

      if (!details.customaryDetails.community) {
        throw new Error('Community must be specified for customary marriages');
      }
    }

    // Validate civil marriage requirements
    if (details.marriageType === MarriageStatus.MARRIED && !details.civilDetails) {
      throw new Error('Civil marriage details are required for civil marriages');
    }

    // Validate polygamous marriage requirements
    if (details.isPolygamous && !details.polygamyApproved) {
      throw new Error('Polygamous marriages require proper approval under Kenyan law');
    }

    // Validate marriage age (simplified)
    // In reality, we'd check spouses' ages
    if (this.isMarriageUnderAge(details.marriageDate)) {
      throw new Error('Marriage must comply with minimum age requirements under Kenyan law');
    }
  }

  private isMarriageUnderAge(marriageDate: Date): boolean {
    // Simplified check - in reality, we'd verify spouses were at least 18
    // Kenya allows marriage at 18, or 16 with parental consent
    const marriageYear = marriageDate.getFullYear();
    return marriageYear > new Date().getFullYear() - 18;
  }

  // Business logic methods
  calculateMarriageDuration(): { years: number; months: number; days: number } {
    const now = new Date();
    const marriageDate = new Date(this.details.marriageDate);

    let years = now.getFullYear() - marriageDate.getFullYear();
    let months = now.getMonth() - marriageDate.getMonth();
    let days = now.getDate() - marriageDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  isLongTermMarriage(): boolean {
    const duration = this.calculateMarriageDuration();
    return duration.years >= 10;
  }

  hasProducedChildren(): boolean {
    // This would be determined by checking for children in the family tree
    // For now, return false as a placeholder
    return false;
  }

  getLegalImplications(): string[] {
    const implications: string[] = [];

    if (this.isLegallyRecognized()) {
      implications.push('Spousal inheritance rights under Law of Succession Act');
      implications.push('Matrimonial property rights');
      implications.push('Spousal maintenance obligations');
    }

    if (this.isCustomaryMarriage()) {
      implications.push('Recognition under customary law');
      implications.push('Bride price considerations in succession');
    }

    if (this.isPolygamous()) {
      implications.push('Equal treatment of spouses in polygamous marriage');
      implications.push('Fair distribution of estate among spouses');
    }

    if (this.isLongTermMarriage()) {
      implications.push('Enhanced spousal protection in property division');
    }

    return implications;
  }

  // Static factory methods
  static createCivilMarriage(
    marriageDate: Date,
    certificateNumber: string,
    registrationOffice: string,
    marriageAct: 'CAP_150' | 'CAP_151' = 'CAP_150',
  ): KenyanMarriage {
    const details: MarriageDetails = {
      marriageDate,
      marriageType: MarriageStatus.MARRIED,
      certificateNumber,
      civilDetails: {
        registrationOffice,
        marriageAct,
        noticePeriodCompleted: true,
      },
      isPolygamous: false,
      polygamyApproved: false,
    };

    return new KenyanMarriage(details);
  }

  static createCustomaryMarriage(
    marriageDate: Date,
    community: string,
    eldersInvolved: string[],
    bridePricePaid: boolean = false,
    bridePriceDetails?: string,
  ): KenyanMarriage {
    const details: MarriageDetails = {
      marriageDate,
      marriageType: MarriageStatus.CUSTOMARY_MARRIAGE,
      customaryDetails: {
        community,
        eldersInvolved,
        bridePricePaid,
        bridePriceDetails,
        traditionalRitesPerformed: ['Introduction', 'Negotiations'], // Default rites
      },
      isPolygamous: false,
      polygamyApproved: false,
    };

    return new KenyanMarriage(details);
  }

  static createPolygamousMarriage(
    marriageDate: Date,
    marriageType: MarriageStatus,
    polygamyApproved: boolean = true,
  ): KenyanMarriage {
    if (!polygamyApproved) {
      throw new Error('Polygamous marriages must be properly approved under Kenyan law');
    }

    const details: MarriageDetails = {
      marriageDate,
      marriageType,
      isPolygamous: true,
      polygamyApproved,
    };

    return new KenyanMarriage(details);
  }
}
