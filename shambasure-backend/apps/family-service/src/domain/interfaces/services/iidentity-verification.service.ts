export interface IIdentityVerificationService {
  // National ID verification
  verifyNationalId(nationalId: string): Promise<{
    valid: boolean;
    details?: {
      fullName: string;
      dateOfBirth: Date;
      gender: string;
      countyOfBirth: string;
      citizenship: string;
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // KRA PIN verification
  verifyKraPin(kraPin: string): Promise<{
    valid: boolean;
    registeredName?: string;
    taxCompliance?: 'COMPLIANT' | 'NON-COMPLIANT' | 'UNKNOWN';
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Birth certificate verification
  verifyBirthCertificate(certificateNumber: string): Promise<{
    valid: boolean;
    details?: {
      childName: string;
      dateOfBirth: Date;
      placeOfBirth: string;
      parents: {
        fatherName: string;
        motherName: string;
      };
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Death certificate verification
  verifyDeathCertificate(certificateNumber: string): Promise<{
    valid: boolean;
    details?: {
      deceasedName: string;
      dateOfDeath: Date;
      placeOfDeath: string;
      causeOfDeath?: string;
      registrationDate: Date;
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Passport verification
  verifyPassport(passportNumber: string): Promise<{
    valid: boolean;
    details?: {
      fullName: string;
      nationality: string;
      dateOfBirth: Date;
      expiryDate: Date;
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Alien card verification
  verifyAlienCard(alienCardNumber: string): Promise<{
    valid: boolean;
    details?: {
      fullName: string;
      nationality: string;
      permitType: string;
      expiryDate: Date;
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Bulk verification
  bulkVerifyIdentities(
    identities: Array<{
      type: 'NATIONAL_ID' | 'KRA_PIN' | 'BIRTH_CERT' | 'DEATH_CERT' | 'PASSPORT' | 'ALIEN_CARD';
      number: string;
    }>,
  ): Promise<Map<string, any>>;

  // Biometric verification
  verifyBiometric(data: {
    type: 'FINGERPRINT' | 'FACE' | 'IRIS';
    template: string;
    referenceId: string;
  }): Promise<{
    match: boolean;
    confidence: number;
    timestamp: Date;
  }>;

  // Document verification
  verifyDocument(document: { type: string; content: Buffer | string; metadata: object }): Promise<{
    genuine: boolean;
    extractedData: object;
    tamperDetection: {
      isTampered: boolean;
      tamperDetails?: string[];
    };
    verificationMethod: string;
    timestamp: Date;
  }>;

  // Identity linkage verification
  verifyIdentityLinkage(identities: {
    nationalId?: string;
    kraPin?: string;
    birthCertificate?: string;
    passport?: string;
  }): Promise<{
    linked: boolean;
    inconsistencies?: Array<{
      field: string;
      value1: string;
      value2: string;
    }>;
    overallConfidence: number;
  }>;

  // Verification history
  getVerificationHistory(identityNumber: string): Promise<
    Array<{
      verificationType: string;
      timestamp: Date;
      result: boolean;
      verifiedBy?: string;
      method: string;
    }>
  >;

  // Verification statistics
  getVerificationStatistics(familyId: string): Promise<{
    totalMembers: number;
    verifiedIdentities: number;
    verificationRate: number;
    pendingVerifications: number;
    verificationMethods: Map<string, number>;
  }>;
}
