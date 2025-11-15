import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ProbateCourtRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasCourtRole = this.hasProbateCourtRole(user.roles);

    if (!hasCourtRole) {
      throw new ForbiddenException(
        'Court role required. Only judges, magistrates, or court registrars can access this resource.',
      );
    }

    return true;
  }

  private hasProbateCourtRole(userRoles: string[]): boolean {
    const courtRoles = [
      'JUDGE',
      'MAGISTRATE',
      'COURT_REGISTRAR',
      'PROBATE_REGISTRAR',
      'SUCCESSION_OFFICER',
    ];

    return userRoles.some((role) => courtRoles.includes(role));
  }
}
