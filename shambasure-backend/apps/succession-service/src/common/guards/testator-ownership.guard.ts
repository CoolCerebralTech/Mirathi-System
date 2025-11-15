import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TESTATOR_OWNERSHIP_METADATA } from '../decorators/testator-ownership.decorator';

@Injectable()
export class TestatorOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireOwnership = this.reflector.get<boolean>(
      TESTATOR_OWNERSHIP_METADATA,
      context.getHandler(),
    );

    if (!requireOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = this.getResourceId(request);

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check ownership based on resource type
    const isOwner = await this.validateOwnership(user.id, resourceId, request);

    if (!isOwner) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }

  private getResourceId(request: any): string {
    return (
      request.params.willId ||
      request.params.assetId ||
      request.params.familyId ||
      request.body.testatorId
    );
  }

  private async validateOwnership(
    userId: string,
    resourceId: string,
    request: any,
  ): Promise<boolean> {
    // In a real implementation, you would query the database
    // For now, we'll simulate ownership validation

    if (request.params.willId) {
      // Check if user owns the will
      return await this.checkWillOwnership(userId, resourceId);
    }

    if (request.params.assetId) {
      // Check if user owns the asset
      return await this.checkAssetOwnership(userId, resourceId);
    }

    if (request.params.familyId) {
      // Check if user created the family
      return await this.checkFamilyOwnership(userId, resourceId);
    }

    return true;
  }

  private async checkWillOwnership(userId: string, willId: string): Promise<boolean> {
    // Simulate database check - in reality, inject WillService
    return true; // Replace with actual check
  }

  private async checkAssetOwnership(userId: string, assetId: string): Promise<boolean> {
    // Simulate database check
    return true; // Replace with actual check
  }

  private async checkFamilyOwnership(userId: string, familyId: string): Promise<boolean> {
    // Simulate database check
    return true; // Replace with actual check
  }
}
