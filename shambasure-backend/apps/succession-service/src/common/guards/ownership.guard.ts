import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { JwtPayload } from '@shamba/auth';
import { PrismaService } from '@shamba/database';

import { CHECK_OWNERSHIP_KEY, OwnershipOptions } from '../decorators/ownership.decorator';

// Extended request type with user
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Ownership Guard - Validates user ownership of resources with contextual role support
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<OwnershipOptions>(CHECK_OWNERSHIP_KEY, context.getHandler());

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('OwnershipGuard triggered without authenticated user');
      throw new ForbiddenException('Authentication required to access this resource');
    }

    // Check if user has global role bypass
    if (options.allowRoles && this.hasGlobalRoleBypass(user, options.allowRoles)) {
      this.logger.debug(`Ownership bypass granted for user ${user.sub} with role: ${user.role}`);
      return true;
    }

    // Extract resource ID from request parameters
    const resourceId = request.params[options.param];
    if (!resourceId) {
      this.logger.error(`Resource ID parameter '${options.param}' not found in request`);
      throw new NotFoundException(`Resource ID parameter '${options.param}' is required`);
    }

    // Perform ownership check based on resource type
    const isOwner = await this.checkResourceOwnership(
      options.resource,
      resourceId,
      user.sub,
      options.field,
    );

    if (!isOwner) {
      this.logger.warn(
        `User ${user.sub} attempted to access ${options.resource} ${resourceId} without ownership`,
      );
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    this.logger.debug(
      `Ownership confirmed for user ${user.sub} on ${options.resource} ${resourceId}`,
    );
    return true;
  }

  /**
   * Check if user has global role that bypasses ownership requirements
   */
  private hasGlobalRoleBypass(user: JwtPayload, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role);
  }

  /**
   * Main ownership check dispatcher - routes to appropriate check method
   */
  private async checkResourceOwnership(
    resource: OwnershipOptions['resource'],
    resourceId: string,
    userId: string,
    customField?: string,
  ): Promise<boolean> {
    // Use type assertion to fix the template literal issue
    const resourceType = resource as string;

    switch (resource) {
      case 'Will':
        return await this.checkWillOwnership(resourceId, userId, customField);

      case 'Asset':
        return await this.checkAssetOwnership(resourceId, userId, customField);

      case 'Family':
        return await this.checkFamilyOwnership(resourceId, userId, customField);

      case 'WillWitness':
        return await this.checkWitnessOwnership(resourceId, userId);

      case 'WillExecutor':
        return await this.checkExecutorOwnership(resourceId, userId);

      case 'BeneficiaryAssignment':
        return await this.checkBeneficiaryOwnership(resourceId, userId);

      default:
        this.logger.error(`Unsupported resource type for ownership check: ${resourceType}`);
        throw new ForbiddenException('Resource type not supported for ownership validation');
    }
  }

  /**
   * Direct Will ownership check
   */
  private async checkWillOwnership(
    willId: string,
    userId: string,
    ownershipField?: string,
  ): Promise<boolean> {
    try {
      const field = ownershipField || 'testatorId';
      const will = await this.prisma.will.findFirst({
        where: {
          id: willId,
          [field]: userId,
        },
        select: { id: true },
      });

      return !!will;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking Will ownership: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Direct Asset ownership check
   */
  private async checkAssetOwnership(
    assetId: string,
    userId: string,
    ownershipField?: string,
  ): Promise<boolean> {
    try {
      const field = ownershipField || 'ownerId';
      const asset = await this.prisma.asset.findFirst({
        where: {
          id: assetId,
          [field]: userId,
        },
        select: { id: true },
      });

      return !!asset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking Asset ownership: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Direct Family ownership check
   */
  private async checkFamilyOwnership(
    familyId: string,
    userId: string,
    ownershipField?: string,
  ): Promise<boolean> {
    try {
      const field = ownershipField || 'creatorId';
      const family = await this.prisma.family.findFirst({
        where: {
          id: familyId,
          [field]: userId,
        },
        select: { id: true },
      });

      return !!family;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking Family ownership: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Witness ownership check - user must be testator of the will containing the witness
   */
  private async checkWitnessOwnership(witnessId: string, userId: string): Promise<boolean> {
    try {
      const witness = await this.prisma.willWitness.findFirst({
        where: {
          id: witnessId,
          will: {
            testatorId: userId,
          },
        },
        include: {
          will: {
            select: { testatorId: true },
          },
        },
      });

      return !!witness;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking witness ownership: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Executor ownership check - user must be testator of the will containing the executor
   */
  private async checkExecutorOwnership(executorId: string, userId: string): Promise<boolean> {
    try {
      const executor = await this.prisma.willExecutor.findFirst({
        where: {
          id: executorId,
          will: {
            testatorId: userId,
          },
        },
        include: {
          will: {
            select: { testatorId: true },
          },
        },
      });

      return !!executor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking executor ownership: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Beneficiary ownership check - user must be testator of the will containing the beneficiary assignment
   */
  private async checkBeneficiaryOwnership(
    beneficiaryAssignmentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const assignment = await this.prisma.beneficiaryAssignment.findFirst({
        where: {
          id: beneficiaryAssignmentId,
          will: {
            testatorId: userId,
          },
        },
        include: {
          will: {
            select: { testatorId: true },
          },
        },
      });

      return !!assignment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking beneficiary ownership: ${errorMessage}`);
      return false;
    }
  }
}
