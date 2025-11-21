import { Injectable } from '@nestjs/common';
import { Asset } from '../entities/asset.entity';
import { AssetOwnershipType } from '@prisma/client';
import { DOCUMENTATION_REQUIREMENTS } from '../../../common/constants/asset-types.constants';

export interface PolicyResult {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  highRisk?: boolean; // Flag for assets that could cause legal disputes
}

@Injectable()
export class AssetVerificationPolicy {
  /**
   * Verifies if an asset is legally eligible to be included in a Will
   * based on Kenyan Succession Law.
   */
  checkTestamentaryCapacity(asset: Asset): PolicyResult {
    const result: PolicyResult = {
      isCompliant: true,
      errors: [],
      warnings: [],
      highRisk: false,
    };

    // 1. Joint Tenancy Rule (Right of Survivorship)
    if (asset.getOwnershipType() === AssetOwnershipType.JOINT_TENANCY) {
      result.isCompliant = false;
      result.errors.push(
        'Assets held in Joint Tenancy cannot be bequeathed in a Will. They pass automatically to the surviving owner (Right of Survivorship).',
      );
    }

    // 2. Active Status Check
    if (!asset.getIsActive()) {
      result.isCompliant = false;
      result.errors.push('Asset is marked as inactive or deleted.');
    }

    // 3. Encumbrance Check (Debt/Liability)
    if (asset.getIsEncumbered()) {
      const netValue = asset.getTransferableValue();
      if (netValue.getAmount() <= 0) {
        result.warnings.push(
          `Asset is heavily encumbered. Liability (${asset.getEncumbranceAmount()}) exceeds or matches share value.`,
        );
        result.highRisk = true;
      } else {
        result.warnings.push(
          `Asset is encumbered. Beneficiary will inherit the asset subject to the debt of ${asset.getEncumbranceAmount()}.`,
        );
      }
    }

    // 4. Verification Status
    if (!asset.getHasVerifiedDocument()) {
      result.warnings.push(
        'Asset documentation has not been verified. This increases the risk of disputes.',
      );
      result.highRisk = true;
    }

    // 5. Additional checks: Land/Property specific
    if (['LAND_PARCEL', 'PROPERTY'].includes(asset.getType())) {
      if (!this.checkLandSearchReadiness(asset)) {
        result.warnings.push(
          'Asset lacks sufficient location or registration details for a land/property search. Risk of legal disputes.',
        );
        result.highRisk = true;
      }
    }

    return result;
  }

  /**
   * Checks if the asset has all the required documents defined in Kenyan constants.
   */
  checkDocumentationCompleteness(asset: Asset, uploadedDocumentTypes: string[]): PolicyResult {
    const result: PolicyResult = {
      isCompliant: true,
      errors: [],
      warnings: [],
      highRisk: false,
    };

    const assetType = asset.getType();
    const requiredDocs =
      DOCUMENTATION_REQUIREMENTS[assetType as keyof typeof DOCUMENTATION_REQUIREMENTS];

    if (!requiredDocs) return result;

    const missingDocs = requiredDocs.filter((req) => !uploadedDocumentTypes.includes(req));

    if (missingDocs.length > 0) {
      result.isCompliant = false; // Consider marking as non-compliant if critical docs are missing
      result.warnings.push(
        `Missing recommended documentation for ${assetType}: ${missingDocs.join(', ')}`,
      );
      result.highRisk = true;
    }

    return result;
  }

  /**
   * Validates if the asset location data is sufficient for a Land Search
   */
  checkLandSearchReadiness(asset: Asset): boolean {
    if (asset.getType() !== 'LAND_PARCEL' && asset.getType() !== 'PROPERTY') {
      return true;
    }

    const id = asset.getIdentification();
    return !!(id?.parcelNumber || id?.registrationNumber);
  }
}
