import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { OwnershipGuard } from '../guards/ownership.guard';

// ============================================================================
// CORE OWNERSHIP DECORATORS
// ============================================================================

/**
 * The metadata key used to store ownership check options.
 */
export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipOptions {
  resource: 'Will' | 'Asset' | 'Family' | 'WillWitness' | 'WillExecutor' | 'BeneficiaryAssignment';
  param: string;
  field?: string; // Custom ownership field (defaults to resource-based logic)
  allowRoles?: string[]; // Global roles that bypass ownership check
}

/**
 * Master ownership decorator - checks if user owns the resource or has bypass roles
 */
export const CheckOwnership = (options: OwnershipOptions) =>
  applyDecorators(SetMetadata(CHECK_OWNERSHIP_KEY, options), UseGuards(OwnershipGuard));

// ============================================================================
// DOMAIN-SPECIFIC OWNERSHIP SHORTCUTS
// ============================================================================

/**
 * Shortcut for Will ownership - testator can access their own wills
 */
export const OwnsWill = (param: string = 'willId') =>
  CheckOwnership({
    resource: 'Will',
    param,
    field: 'testatorId',
  });

/**
 * Shortcut for Asset ownership - owner can access their assets
 */
export const OwnsAsset = (param: string = 'assetId') =>
  CheckOwnership({
    resource: 'Asset',
    param,
    field: 'ownerId',
  });

/**
 * Shortcut for Family access - creator can access their family records
 */
export const OwnsFamily = (param: string = 'familyId') =>
  CheckOwnership({
    resource: 'Family',
    param,
    field: 'creatorId',
  });

/**
 * Shortcut for Witness access through Will ownership
 */
export const OwnsWitness = (param: string = 'witnessId') =>
  CheckOwnership({
    resource: 'WillWitness',
    param,
    // Will be checked via Will ownership in the guard
  });

/**
 * Shortcut for Executor access through Will ownership
 */
export const OwnsExecutor = (param: string = 'executorId') =>
  CheckOwnership({
    resource: 'WillExecutor',
    param,
    // Will be checked via Will ownership in the guard
  });

/**
 * Shortcut for Beneficiary access through Will ownership
 */
export const OwnsBeneficiary = (param: string = 'beneficiaryAssignmentId') =>
  CheckOwnership({
    resource: 'BeneficiaryAssignment',
    param,
    // Will be checked via Will ownership in the guard
  });

// ============================================================================
// ADMINISTRATIVE ACCESS (Role-based bypass)
// ============================================================================

/**
 * Admin access - can bypass ownership checks for system administration
 */
export const AdminAccess = () =>
  applyDecorators(
    SetMetadata('roles', ['ADMIN']),
    // RoleGuard would be applied separately from @shamba/auth
  );

/**
 * Verifier access - for document and identity verification
 */
export const VerifierAccess = () => applyDecorators(SetMetadata('roles', ['VERIFIER', 'ADMIN']));

/**
 * Auditor access - for compliance and audit operations
 */
export const AuditorAccess = () => applyDecorators(SetMetadata('roles', ['AUDITOR', 'ADMIN']));

// ============================================================================
// COMPOSITE DECORATORS (Combine multiple guards)
// ============================================================================

/**
 * Composite decorator for Will operations that require ownership + draft status
 * Note: WillStatusGuard would be applied separately
 */
export const OwnsEditableWill = (param: string = 'willId') => applyDecorators(OwnsWill(param));

/**
 * Composite decorator for administrative asset access
 */
export const AdministrativeAssetAccess = (param: string = 'assetId') =>
  applyDecorators(OwnsAsset(param), AdminAccess());
