// domain/interfaces/services/iidentity-verification.service.ts

export interface IdentityVerificationResult {
  isVerified: boolean;
  confidenceScore: number; // 0-100
  matchedName?: string;
  discrepancies: string[];
  deathStatus?: 'ALIVE' | 'DECEASED'; // From Civil Registration
}

export interface IIdentityVerificationService {
  /**
   * Verifies a National ID number against government registries.
   */
  verifyNationalId(nationalId: string, providedName: string): Promise<IdentityVerificationResult>;

  /**
   * Verifies a KRA PIN.
   * Critical for Estate Tax compliance.
   */
  verifyKraPin(pin: string, providedName: string): Promise<IdentityVerificationResult>;

  /**
   * Verifies a Death Certificate Number.
   * Critical for preventing fraud in succession cases.
   */
  verifyDeathCertificate(
    certNumber: string,
    deceasedName: string,
  ): Promise<IdentityVerificationResult>;
}
