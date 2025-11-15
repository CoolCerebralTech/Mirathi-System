import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WillStatus } from '@prisma/client';

@Injectable()
export class WillStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const willId = request.params.willId || request.body.willId;

    if (!willId) {
      return true; // No will ID in request, proceed
    }

    const will = await this.getWill(willId);

    if (!will) {
      throw new BadRequestException('Will not found');
    }

    // Prevent modifications to active, executed, or contested wills
    if (this.isImmutableStatus(will.status)) {
      throw new BadRequestException(
        `Cannot modify will with status: ${will.status}. ` +
          'Only DRAFT or PENDING_WITNESS wills can be modified.',
      );
    }

    // Store will in request for use in controllers
    request.will = will;

    return true;
  }

  private isImmutableStatus(status: WillStatus): boolean {
    const immutableStatuses = [
      WillStatus.ACTIVE,
      WillStatus.EXECUTED,
      WillStatus.REVOKED,
      WillStatus.SUPERSEDED,
      WillStatus.CONTESTED,
      WillStatus.PROBATE,
    ];
    return immutableStatuses.includes(status);
  }

  private async getWill(willId: string): Promise<any> {
    // Simulate will retrieval - inject WillService in real implementation
    return {
      id: willId,
      status: WillStatus.DRAFT, // Example status
      testatorId: 'user-id',
    };
  }
}
