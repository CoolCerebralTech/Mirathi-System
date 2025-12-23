// src/domain/value-objects/guardian-contact.vo.ts
import { ValueObject } from '../base/value-object';

export interface GuardianContactProps {
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  physicalAddress: string;
  county: string;
  subCounty?: string;

  // 🎯 INNOVATIVE: Emergency contact chain
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    priority: number; // 1 = first contact, 2 = second, etc.
    canMakeDecisions: boolean;
  }>;

  // 🎯 INNOVATIVE: Communication preferences
  preferredContactMethod: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  languagePreference: 'EN' | 'SW' | 'OTHER';
  receiveNotifications: boolean;
}

export class GuardianContactVO extends ValueObject<GuardianContactProps> {
  constructor(props: GuardianContactProps) {
    super(props);
  }

  protected validate(): void {
    // Validate Kenyan phone number
    const phoneRegex = /^(?:254|\+254|0)?(7\d{8})$/;
    if (!phoneRegex.test(this.props.primaryPhone)) {
      throw new Error('Invalid Kenyan phone number');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.props.email)) {
      throw new Error('Invalid email address');
    }

    // Emergency contacts must have unique priorities
    const priorities = this.props.emergencyContacts.map((ec) => ec.priority);
    if (new Set(priorities).size !== priorities.length) {
      throw new Error('Emergency contact priorities must be unique');
    }
  }

  // 🎯 INNOVATIVE: Format phone for different uses
  public getFormattedPhone(format: 'INTERNATIONAL' | 'LOCAL' | 'E164'): string {
    const cleanNumber = this.props.primaryPhone.replace(/\D/g, '');

    if (cleanNumber.startsWith('254')) {
      switch (format) {
        case 'INTERNATIONAL':
          return `+${cleanNumber}`;
        case 'LOCAL':
          return `0${cleanNumber.substring(3)}`;
        case 'E164':
          return `+${cleanNumber}`;
      }
    }

    // Assume it's already in one format
    return this.props.primaryPhone;
  }

  // 🎯 INNOVATIVE: Get next emergency contact in chain
  public getNextEmergencyContact(
    lastContacted?: string,
  ): (typeof this.props.emergencyContacts)[0] | null {
    const sortedContacts = [...this.props.emergencyContacts].sort(
      (a, b) => a.priority - b.priority,
    );

    if (!lastContacted) {
      return sortedContacts[0];
    }

    const lastIndex = sortedContacts.findIndex((ec) => ec.phone === lastContacted);
    if (lastIndex === -1 || lastIndex >= sortedContacts.length - 1) {
      return null; // No more contacts
    }

    return sortedContacts[lastIndex + 1];
  }

  // 🎯 INNOVATIVE: Generate contact card for court filing
  public generateContactCard(): Record<string, any> {
    return {
      guardianContact: {
        phone: this.getFormattedPhone('INTERNATIONAL'),
        email: this.props.email,
        address: this.props.physicalAddress,
        county: this.props.county,
      },
      emergencyChain: this.props.emergencyContacts
        .sort((a, b) => a.priority - b.priority)
        .map((ec) => ({
          name: ec.name,
          relationship: ec.relationship,
          contact: ec.phone,
          canDecide: ec.canMakeDecisions,
        })),
      preferredLanguage: this.props.languagePreference === 'SW' ? 'Kiswahili' : 'English',
    };
  }

  // 🎯 INNOVATIVE: Check if contact is reachable during emergencies
  public isReachable(): { primary: boolean; secondary: boolean; emergency: boolean } {
    const now = new Date();
    const hour = now.getHours();

    // Assume business hours for primary
    const primaryReachable = hour >= 8 && hour <= 18;

    // Secondary is backup
    const secondaryReachable = this.props.secondaryPhone !== undefined;

    // At least one emergency contact with decision power
    const emergencyReachable = this.props.emergencyContacts.some((ec) => ec.canMakeDecisions);

    return {
      primary: primaryReachable,
      secondary: secondaryReachable,
      emergency: emergencyReachable,
    };
  }

  public static create(props: GuardianContactProps): GuardianContactVO {
    return new GuardianContactVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.props,
      formattedPhone: this.getFormattedPhone('INTERNATIONAL'),
      contactCard: this.generateContactCard(),
      reachability: this.isReachable(),
    };
  }
}
