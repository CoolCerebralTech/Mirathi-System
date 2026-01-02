// src/presentation/guards/gql-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

/**
 * GraphQL Authentication Guard
 *
 * Extends JwtAuthGuard from @shamba/auth to work with GraphQL context.
 * Validates JWT token from Authorization header.
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  /**
   * Extract request from GraphQL context
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  /**
   * Handle authentication result
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
