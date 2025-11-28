import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '@shamba/database';
import { WillStatus } from '@prisma/client';
import { ALLOWED_WILL_ACTIONS_KEY, WillActionOptions } from '../decorators/will-status.decorator';

// Extended request type with will status
interface WillStatusRequest extends Request {
  willStatus?: WillStatus;
  params: Record<string, string>;
  body: Record<string, unknown>;
}

/**
 * A guard that protects will-related endpoints by checking the will's current status.
 *
 * Features:
 * - Validates will status against allowed actions
 * - Customizable parameter names for will ID
 * - Comprehensive error handling with status context
 * - Automatic will status attachment to request
 */
@Injectable()
export class WillStatusGuard implements CanActivate {
  private readonly logger = new Logger(WillStatusGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<WillActionOptions>(
      ALLOWED_WILL_ACTIONS_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!options || !options.actions || options.actions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<WillStatusRequest>();

    // Extract will ID from request parameters
    const paramName = options.param || 'willId';
    const willId = this.extractWillId(request, paramName);

    if (!willId) {
      this.logger.warn(
        `WillStatusGuard triggered, but no willId found in parameter '${paramName}'`,
      );
      throw new BadRequestException(`Will ID parameter '${paramName}' is required`);
    }

    // Fetch will from database
    const will = await this.prisma.will.findUnique({
      where: {
        id: willId,
        deletedAt: null, // Only consider non-deleted wills
      },
      select: {
        id: true,
        status: true,
        title: true,
      },
    });

    if (!will) {
      this.logger.warn(`Will with ID '${willId}' not found`);
      throw new NotFoundException(`Will with ID '${willId}' not found`);
    }

    const currentStatus = will.status;

    // Get allowed actions for current status from our constants
    // We'll use a simple mapping for now - in a real app, this would come from WILL_STATUS constants
    const permittedActions = this.getAllowedActionsForStatus(currentStatus);

    // Check if ANY of the required actions are permitted
    const isActionAllowed = options.actions.some((action) => permittedActions.includes(action));

    if (!isActionAllowed) {
      this.logger.warn(
        `Action '${options.actions.join(', ')}' not allowed for will ${willId} with status '${currentStatus}'`,
      );
      throw new ForbiddenException(
        `Cannot perform the requested action on a will with status '${currentStatus}'.`,
        `Allowed actions: ${permittedActions.join(', ')}`,
      );
    }

    // Attach will status to request for use in controllers
    request.willStatus = will.status;

    this.logger.debug(
      `Will status validation passed for will ${willId} with status '${currentStatus}'`,
    );
    return true;
  }

  /**
   * Extract will ID from request with proper typing
   */
  private extractWillId(request: WillStatusRequest, paramName: string): string | null {
    // Check params first
    const paramValue = request.params[paramName];
    if (paramValue && typeof paramValue === 'string') {
      return paramValue;
    }

    // Check body as fallback
    const bodyValue = request.body[paramName];
    if (bodyValue && typeof bodyValue === 'string') {
      return bodyValue;
    }

    return null;
  }

  /**
   * Get allowed actions for a given will status
   * In a real application, this would come from WILL_STATUS constants
   */
  private getAllowedActionsForStatus(status: WillStatus): string[] {
    // This is a simplified mapping - replace with actual WILL_STATUS constants import
    const statusActions: Record<WillStatus, string[]> = {
      [WillStatus.DRAFT]: [
        'UPDATE',
        'DELETE',
        'ADD_ASSET',
        'ADD_WITNESS',
        'ADD_BENEFICIARY',
        'ADD_EXECUTOR',
        'VIEW',
      ],
      [WillStatus.PENDING_WITNESS]: ['UPDATE', 'ADD_WITNESS', 'SIGN_WITNESS', 'VIEW'],
      [WillStatus.WITNESSED]: ['ACTIVATE', 'VIEW'],
      [WillStatus.ACTIVE]: ['REVOKE', 'VIEW'],
      [WillStatus.REVOKED]: ['VIEW'],
      [WillStatus.SUPERSEDED]: ['VIEW'],
      [WillStatus.EXECUTED]: ['VIEW'],
      [WillStatus.CONTESTED]: ['VIEW'],
      [WillStatus.PROBATE]: ['VIEW'],
    };

    return statusActions[status] || ['VIEW']; // Default to view-only if status not found
  }
}
