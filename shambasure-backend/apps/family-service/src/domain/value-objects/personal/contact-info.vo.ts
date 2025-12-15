// domain/value-objects/personal/contact-info.vo.ts
import { ValueObject } from '../base/value-object';

export interface KenyanAddress {
  street?: string;
  building?: string;
  estate?: string;
  village?: string;
  subCounty?: string;
  county: string;
  postalCode?: string;
  postalAddress?: string;
  gpsCoordinates?: string;
  landmark?: string;
}

export interface ContactInfoProps {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  addresses: KenyanAddress[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  private constructor(props: ContactInfoProps) {
    super(props);
    this.validate();
  }

  static create(primaryPhone: string, county: string): ContactInfo {
    return new ContactInfo({
      primaryPhone,
      addresses: [{ county }],
    });
  }

  static createFromProps(props: ContactInfoProps): ContactInfo {
    return new ContactInfo(props);
  }

  validate(): void {
    // Primary phone validation (Kenyan format)
    if (!this._value.primaryPhone) {
      throw new Error('Primary phone number is required');
    }

    if (!this.isValidKenyanPhone(this._value.primaryPhone)) {
      throw new Error('Primary phone must be a valid Kenyan number');
    }

    // Secondary phone validation (optional)
    if (this._value.secondaryPhone && !this.isValidKenyanPhone(this._value.secondaryPhone)) {
      throw new Error('Secondary phone must be a valid Kenyan number');
    }

    // Email validation (optional)
    if (this._value.email && !this.isValidEmail(this._value.email)) {
      throw new Error('Email must be valid');
    }

    // Address validation
    if (!this._value.addresses || this._value.addresses.length === 0) {
      throw new Error('At least one address is required');
    }

    for (const address of this._value.addresses) {
      if (!address.county) {
        throw new Error('County is required for all addresses');
      }

      // Validate Kenyan county
      if (!this.isValidKenyanCounty(address.county)) {
        throw new Error(`Invalid Kenyan county: ${address.county}`);
      }

      // Validate GPS coordinates if provided
      if (address.gpsCoordinates && !this.isValidGPSCoordinates(address.gpsCoordinates)) {
        throw new Error('Invalid GPS coordinates format');
      }
    }

    // Emergency contact validation
    if (this._value.emergencyContact) {
      if (
        !this._value.emergencyContact.name ||
        this._value.emergencyContact.name.trim().length < 2
      ) {
        throw new Error('Emergency contact name is required');
      }

      if (
        !this._value.emergencyContact.relationship ||
        this._value.emergencyContact.relationship.trim().length === 0
      ) {
        throw new Error('Emergency contact relationship is required');
      }

      if (!this.isValidKenyanPhone(this._value.emergencyContact.phone)) {
        throw new Error('Emergency contact phone must be a valid Kenyan number');
      }

      if (
        this._value.emergencyContact.email &&
        !this.isValidEmail(this._value.emergencyContact.email)
      ) {
        throw new Error('Emergency contact email must be valid');
      }
    }
  }

  private isValidKenyanPhone(phone: string): boolean {
    // Kenyan phone formats:
    // - 07xx xxx xxx (10 digits)
    // - +2547xx xxx xxx (13 digits)
    // - 2547xx xxx xxx (12 digits)
    const cleaned = phone.replace(/\s+/g, '').replace(/\+/g, '');
    return /^(0|254)?7[0-9]{8}$/.test(cleaned);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidKenyanCounty(county: string): boolean {
    const validCounties = [
      'BARINGO',
      'BOMET',
      'BUNGOMA',
      'BUSIA',
      'ELGEYO_MARAKWET',
      'EMBU',
      'GARISSA',
      'HOMA_BAY',
      'ISIOLO',
      'KAJIADO',
      'KAKAMEGA',
      'KERICHO',
      'KIAMBU',
      'KILIFI',
      'KIRINYAGA',
      'KISII',
      'KISUMU',
      'KITUI',
      'KWALE',
      'LAIKIPIA',
      'LAMU',
      'MACHAKOS',
      'MAKUENI',
      'MANDERA',
      'MARSABIT',
      'MERU',
      'MIGORI',
      'MOMBASA',
      'MURANGA',
      'NAIROBI',
      'NAKURU',
      'NANDI',
      'NAROK',
      'NYAMIRA',
      'NYANDARUA',
      'NYERI',
      'SAMBURU',
      'SIAYA',
      'TAITA_TAVETA',
      'TANA_RIVER',
      'THARAKA_NITHI',
      'TRANS_NZOIA',
      'TURKANA',
      'UASIN_GISHU',
      'VIHIGA',
      'WAJIR',
      'WEST_POKOT',
    ];
    return validCounties.includes(county.toUpperCase());
  }

  private isValidGPSCoordinates(coordinates: string): boolean {
    // Simple GPS coordinate validation
    const gpsRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    return gpsRegex.test(coordinates);
  }

  updatePrimaryPhone(phone: string): ContactInfo {
    if (!this.isValidKenyanPhone(phone)) {
      throw new Error('Primary phone must be a valid Kenyan number');
    }
    return new ContactInfo({
      ...this._value,
      primaryPhone: phone,
    });
  }

  updateSecondaryPhone(phone?: string): ContactInfo {
    if (phone && !this.isValidKenyanPhone(phone)) {
      throw new Error('Secondary phone must be a valid Kenyan number');
    }
    return new ContactInfo({
      ...this._value,
      secondaryPhone: phone,
    });
  }

  updateEmail(email?: string): ContactInfo {
    if (email && !this.isValidEmail(email)) {
      throw new Error('Email must be valid');
    }
    return new ContactInfo({
      ...this._value,
      email,
    });
  }

  addAddress(address: KenyanAddress): ContactInfo {
    if (!address.county) {
      throw new Error('County is required for address');
    }
    if (!this.isValidKenyanCounty(address.county)) {
      throw new Error(`Invalid Kenyan county: ${address.county}`);
    }
    const addresses = [...this._value.addresses, address];
    return new ContactInfo({
      ...this._value,
      addresses,
    });
  }

  removeAddress(index: number): ContactInfo {
    const addresses = this._value.addresses.filter((_, i) => i !== index);
    if (addresses.length === 0) {
      throw new Error('At least one address is required');
    }
    return new ContactInfo({
      ...this._value,
      addresses,
    });
  }

  updateEmergencyContact(
    name: string,
    relationship: string,
    phone: string,
    email?: string,
  ): ContactInfo {
    if (!this.isValidKenyanPhone(phone)) {
      throw new Error('Emergency contact phone must be a valid Kenyan number');
    }
    if (email && !this.isValidEmail(email)) {
      throw new Error('Emergency contact email must be valid');
    }
    return new ContactInfo({
      ...this._value,
      emergencyContact: { name, relationship, phone, email },
    });
  }

  removeEmergencyContact(): ContactInfo {
    return new ContactInfo({
      ...this._value,
      emergencyContact: undefined,
    });
  }

  get primaryPhone(): string {
    return this._value.primaryPhone;
  }

  get secondaryPhone(): string | undefined {
    return this._value.secondaryPhone;
  }

  get email(): string | undefined {
    return this._value.email;
  }

  get addresses(): KenyanAddress[] {
    return [...this._value.addresses];
  }

  get emergencyContact() {
    return this._value.emergencyContact;
  }

  // Get formatted phone number
  get formattedPrimaryPhone(): string {
    const cleaned = this._value.primaryPhone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254${cleaned.substring(1)}`;
    }
    return this._value.primaryPhone;
  }

  // Get primary address (first in list)
  get primaryAddress(): KenyanAddress {
    return this._value.addresses[0];
  }

  // Check if contact has valid emergency contact
  get hasEmergencyContact(): boolean {
    return !!this._value.emergencyContact;
  }

  // Check if contact has email
  get hasEmail(): boolean {
    return !!this._value.email;
  }

  // Get counties where person has addresses
  get counties(): string[] {
    return this._value.addresses.map((addr) => addr.county);
  }

  // Check if person has address in specific county
  hasAddressInCounty(county: string): boolean {
    return this._value.addresses.some((addr) => addr.county.toUpperCase() === county.toUpperCase());
  }

  toJSON() {
    return {
      primaryPhone: this._value.primaryPhone,
      formattedPrimaryPhone: this.formattedPrimaryPhone,
      secondaryPhone: this._value.secondaryPhone,
      email: this._value.email,
      addresses: this._value.addresses,
      emergencyContact: this._value.emergencyContact,
      hasEmergencyContact: this.hasEmergencyContact,
      hasEmail: this.hasEmail,
      counties: this.counties,
      primaryAddress: this.primaryAddress,
    };
  }
}
