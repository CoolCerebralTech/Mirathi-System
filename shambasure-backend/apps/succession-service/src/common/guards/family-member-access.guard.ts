import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class FamilyMemberAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const familyId = request.params.familyId || request.body.familyId;

    if (!familyId) {
      return true; // No family ID in request
    }

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const isFamilyMember = await this.validateFamilyMembership(user.id, familyId);

    if (!isFamilyMember) {
      throw new ForbiddenException('Access denied. You are not a member of this family.');
    }

    return true;
  }

  private async validateFamilyMembership(userId: string, familyId: string): Promise<boolean> {
    // Simulate family membership check - inject FamilyService in real implementation
    const userFamilies = await this.getUserFamilies(userId);
    return userFamilies.some((family) => family.id === familyId);
  }

  private async getUserFamilies(userId: string): Promise<any[]> {
    // Simulate database query
    return [
      { id: 'family-1', name: 'Kamau Family' },
      { id: 'family-2', name: 'Wanjiku Family' },
    ];
  }
}
