import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@shamba/database';
import { ALLOWED_WILL_ACTIONS_KEY, WillAction } from '../decorators/will-status.decorator';
import { BusinessRuleViolationException } from '../exceptions/business-rule-violation.exception';
import { WILL_STATUS } from '../constants/will-status.constants';

/**
 * A guard that protects will-related endpoints by checking the will's current status.
 *
 * It is activated by the `@AllowedWillActions()` decorator, which specifies what
 * action is being attempted. The guard fetches the will from the database and
 * checks its status against our centralized `WILL_STATUS` state machine to see
 * if the action is permitted.
 */
@Injectable()
export class WillStatusGuard implements CanActivate {
  private readonly logger = new Logger(WillStatusGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedActions = this.reflector.get<WillAction[]>(
      ALLOWED_WILL_ACTIONS_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!allowedActions || allowedActions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const willId = request.params.willId || request.body.willId;

    if (!willId) {
      this.logger.warn('WillStatusGuard was triggered, but no willId was found in the request.');
      // We let the request proceed; a missing ID will be caught by a validation pipe.
      return true;
    }

    // --- IMPROVEMENT 1: Real Database Access ---
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      select: { id: true, status: true },
    });

    if (!will) {
      throw new NotFoundException(`Will with ID '${willId}' not found.`);
    }

    const currentStatus = will.status;

    // --- IMPROVEMENT 2: Consume Centralized State Machine ---
    const permittedActionsForCurrentStatus = WILL_STATUS[currentStatus].allowedActions;

    // Check if ANY of the actions required by the endpoint are permitted in the will's current state.
    const isActionAllowed = allowedActions.some((action) =>
      (permittedActionsForCurrentStatus as readonly string[]).includes(action),
    );

    if (!isActionAllowed) {
      // --- IMPROVEMENT 3: Throw our custom, structured exception ---
      throw new BusinessRuleViolationException(
        `Cannot perform the action '${allowedActions.join(', ')}' on a will with the status '${currentStatus}'.`,
        'WILL_STATUS_IMMUTABLE',
        {
          willId: will.id,
          currentStatus: will.status,
          attemptedActions: allowedActions,
          permittedActions: permittedActionsForCurrent - status,
        },
      );
    }

    // For convenience, attach the fetched will status to the request
    request.willStatus = will.status;

    return true;
  }
}
