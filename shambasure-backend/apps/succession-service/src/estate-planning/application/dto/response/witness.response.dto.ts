// estate-planning/application/dto/response/witness.response.dto.ts
import { WitnessStatus } from '@prisma/client';

export class WitnessResponseDto {
  id: string;
  willId: string;
  witnessInfo: {
    userId?: string;
    fullName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    relationship?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
    };
  };
  status: WitnessStatus;
  signedAt?: Date;
  signatureData?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  witnessName: string;
  isRegisteredUser: boolean;
  hasSigned: boolean;
  isVerified: boolean;
  canSign: boolean;
  legalValidation: {
    isValid: boolean;
    issues: string[];
  };
}
