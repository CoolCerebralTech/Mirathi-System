import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { WillStatusGuard } from '../guards/will-status.guard';

/**
 * The metadata key used to store the allowed actions for a will-related route.
 */
export const ALLOWED_WILL_ACTIONS_KEY = 'allowedWillActions';

/**
 * A type representing the actions that can be performed on a will.
 * This should be kept in sync with the state machine in will-status.constants.ts
 */
export type WillAction =
  | 'UPDATE'
  | 'DELETE'
  | 'ADD_ASSET'
  | 'ADD_WITNESS'
  | 'SIGN_WITNESS'
  | 'ACTIVATE'
  | 'REVOKE'
  | 'EXECUTE'
  | 'VIEW'
  | 'ADD_BENEFICIARY'
  | 'ADD_EXECUTOR';

export interface WillActionOptions {
  actions: WillAction[];
  param?: string; // Custom parameter name (defaults to 'willId')
}

/**
 * A method decorator that protects a route by ensuring a Will is in the correct
 * status to perform a specific action. It applies the WillStatusGuard.
 *
 * @param options The action configuration or array of actions
 *
 * @example
 * @Patch(':willId')
 * @AllowedWillActions(['UPDATE'])
 * updateWill(@Param('willId') willId: string) { ... }
 *
 * @example
 * @Post(':willId/witnesses')
 * @AllowedWillActions({ actions: ['ADD_WITNESS', 'SIGN_WITNESS'], param: 'willId' })
 * addWitness(@Param('willId') willId: string) { ... }
 */
export const AllowedWillActions = (options: WillAction[] | WillActionOptions) => {
  const normalizedOptions = Array.isArray(options) ? { actions: options } : options;

  return applyDecorators(
    SetMetadata(ALLOWED_WILL_ACTIONS_KEY, normalizedOptions),
    UseGuards(WillStatusGuard),
  );
};

// ============================================================================
// DOMAIN-SPECIFIC WILL ACTION SHORTCUTS
// ============================================================================

/**
 * Shortcut for will modification actions (update, delete)
 */
export const EditableWill = (param: string = 'willId') =>
  AllowedWillActions({ actions: ['UPDATE', 'DELETE'], param });

/**
 * Shortcut for will content management (assets, beneficiaries, executors)
 */
export const ContentManagementAllowed = (param: string = 'willId') =>
  AllowedWillActions({
    actions: ['ADD_ASSET', 'ADD_BENEFICIARY', 'ADD_EXECUTOR'],
    param,
  });

/**
 * Shortcut for witness management actions
 */
export const WitnessManagementAllowed = (param: string = 'willId') =>
  AllowedWillActions({
    actions: ['ADD_WITNESS', 'SIGN_WITNESS'],
    param,
  });

/**
 * Shortcut for will lifecycle actions (activate, revoke, execute)
 */
export const LifecycleActionsAllowed = (param: string = 'willId') =>
  AllowedWillActions({
    actions: ['ACTIVATE', 'REVOKE', 'EXECUTE'],
    param,
  });

/**
 * Shortcut for read-only access to will
 */
export const ReadOnlyWill = (param: string = 'willId') =>
  AllowedWillActions({
    actions: ['VIEW'],
    param,
  });
