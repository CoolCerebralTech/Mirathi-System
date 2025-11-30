import { Injectable } from '@nestjs/common';
import { AssetOwnershipType, AssetType, AssetVerificationStatus } from '@prisma/client';

import { DOCUMENTATION_REQUIREMENTS } from '../../../common/constants/asset-types.constants';
import { Asset } from '../entities/asset.entity';

export interface PolicyResult {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  highRisk: boolean;
}

/**
 * Asset Verification Policy
 *
 * Enforces Kenyan Succession Law and Property Law constraints regarding
 * what assets can validly be included in a testamentary disposition.
 */
@Injectable()
export class AssetVerificationPolicy {
  /**
   * Verifies if an asset is legally eligible to be included in a Will.
   *
   * Legal Basis:
   * - Law of Succession Act (Cap 160)
   * - Land Registration Act (Joint Tenancy rules)
   * - Matrimonial Property Act (Spousal consent)
   */
  checkTestamentaryCapacity(asset: Asset): PolicyResult {
    const result: PolicyResult = {
      isCompliant: true,
      errors: [],
      warnings: [],
      highRisk: false,
    };

    // 1. Joint Tenancy Rule (Right of Survivorship)
    // Assets held in Joint Tenancy pass automatically to the survivor, bypassing the Will.
    if (asset.ownershipType === AssetOwnershipType.JOINT_TENANCY) {
      result.isCompliant = false;
      result.errors.push(
        'Assets held in Joint Tenancy cannot be bequeathed in a Will. They pass automatically to the surviving owner (Right of Survivorship).',
      );
    }

    // 2. Active Status Check
    if (!asset.isActive) {
      result.isCompliant = false;
      result.errors.push('Asset is marked as inactive, sold, or deleted.');
    }

    // 3. Matrimonial Property Check (Matrimonial Property Act, 2013)
    // Alienation of matrimonial property requires spousal consent.
    if (asset.isMatrimonialProperty && asset.spouseConsentRequired) {
      result.highRisk = true;
      result.warnings.push(
        'Asset is marked as Matrimonial Property. Ensure spousal consent is documented to prevent the Will being contested.',
      );
    }

    // 4. Life Interest Check (Cap 160, Section 37)
    // If the asset is currently held subject to a life interest, it cannot be distributed absolutely.
    if (asset.hasActiveLifeInterest()) {
      result.isCompliant = false; // Usually requires termination of life interest first
      result.errors.push(
        'Asset is currently subject to an active Life Interest and cannot be bequeathed absolutely until the life interest determines.',
      );
    }

    // 5. Encumbrance & Solvency Check
    if (asset.isEncumbered) {
      const netEquity = asset.getNetEquityValue(); // Returns number
      const debtAmount = asset.encumbranceAmount || 0;

      if (netEquity <= 0) {
        result.highRisk = true;
        result.warnings.push(
          `Asset is insolvent/heavily encumbered. Debt (${debtAmount} ${asset.currency}) exceeds or equals estimated value.`,
        );
      } else {
        result.warnings.push(
          `Asset is encumbered. Beneficiary will inherit the asset subject to the debt of ${debtAmount} ${asset.currency}.`,
        );
      }
    }

    // 6. Verification Status
    // Unverified assets are valid in a Will but pose high probate risk.
    if (asset.verificationStatus !== AssetVerificationStatus.VERIFIED) {
      result.highRisk = true;
      result.warnings.push(
        `Asset verification status is ${asset.verificationStatus}. Unverified assets increase the risk of probate delays or disputes.`,
      );
    }

    // 7. Land/Property Specific Checks
    // FIX: Explicitly type the array to allow checking against generic AssetType
    const landTypes: AssetType[] = [AssetType.LAND_PARCEL, AssetType.PROPERTY];

    if (landTypes.includes(asset.type)) {
      if (!this.checkLandSearchReadiness(asset)) {
        result.highRisk = true;
        result.warnings.push(
          'Asset lacks sufficient Title Deed or L.R. Number details for a valid Land Search.',
        );
      }
    }

    return result;
  }

  /**
   * Checks if the asset has all the required documents defined in constants.
   */
  checkDocumentationCompleteness(asset: Asset, uploadedDocumentTypes: string[]): PolicyResult {
    const result: PolicyResult = {
      isCompliant: true,
      errors: [],
      warnings: [],
      highRisk: false,
    };

    const requiredDocs =
      DOCUMENTATION_REQUIREMENTS[asset.type as keyof typeof DOCUMENTATION_REQUIREMENTS];

    if (!requiredDocs) return result;

    const missingDocs = requiredDocs.filter((req: string) => !uploadedDocumentTypes.includes(req));

    if (missingDocs.length > 0) {
      // In Kenya, missing a Title Deed doesn't make the Will invalid,
      // but it makes Administration difficult. Hence, warning, not error.
      result.warnings.push(
        `Missing recommended documentation for ${asset.type}: ${missingDocs.join(', ')}`,
      );
      result.highRisk = true;
    }

    return result;
  }

  /**
   * Validates if the asset location data is sufficient for a Kenyan Land Search.
   * Requires either a Land Reference Number (L.R. No) or a Title Deed Number.
   */
  private checkLandSearchReadiness(asset: Asset): boolean {
    if (asset.type !== AssetType.LAND_PARCEL && asset.type !== AssetType.PROPERTY) {
      return true;
    }

    // Check specific Kenyan land identifiers
    const hasLrNumber = !!asset.landReferenceNumber && asset.landReferenceNumber.length > 0;
    const hasTitleNumber = !!asset.titleDeedNumber && asset.titleDeedNumber.length > 0;

    return hasLrNumber || hasTitleNumber;
  }
}
