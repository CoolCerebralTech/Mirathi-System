// estate-planning/application/dto/response/will.response.dto.ts
import { WillStatus } from '@prisma/client';

export class WillResponseDto {
  id: string;
  title: string;
  status: WillStatus;
  testatorId: string;
  willDate: Date;
  lastModified: Date;
  versionNumber: number;
  activatedAt?: Date;
  executedAt?: Date;
  revokedAt?: Date;
  funeralWishes?: {
    burialLocation?: string;
    funeralType?: string;
    specificInstructions?: string;
  };
  burialLocation?: string;
  residuaryClause?: string;
  requiresWitnesses: boolean;
  witnessCount: number;
  hasAllWitnesses: boolean;
  digitalAssetInstructions?: {
    socialMediaHandling?: string;
    emailAccountHandling?: string;
  };
  specialInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  canBeModified: boolean;
  isActiveWill: boolean;
  isRevocable: boolean;
  legalCompliance: {
    isValid: boolean;
    issues: string[];
  };
}
