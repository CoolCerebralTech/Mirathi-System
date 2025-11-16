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
  | 'ACTIVATE';

/**
 * A method decorator that protects a route by ensuring a Will is in the correct
 * status to perform a specific action. It applies the WillStatusGuard.
 *
 * @param actions The action or actions being performed by this route handler.
 *
 * @example
 * @Patch(':willId/witness')
 * @UseGuards(JwtAuthGuard, OwnershipGuard)
 * @AllowedWillActions('ADD_WITNESS', 'SIGN_WITNESS')
 * addWitnessToWill(@Param('willId') willId: string, ...) { ... }
 */
export const AllowedWillActions = (...actions: WillAction[]) =>
  applyDecorators(SetMetadata(ALLOWED_WILL_ACTIONS_KEY, actions), UseGuards(WillStatusGuard));
