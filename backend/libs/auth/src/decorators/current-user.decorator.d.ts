import { JwtPayload } from '../interfaces/auth.interface';
/**
 * A parameter decorator to extract the authenticated user's JWT payload
 * from the request object. Assumes that an authentication guard (e.g., JwtAuthGuard)
 * has already run and attached the user object to the request.
 *
 * @example
 * // 1. Get the entire user payload:
 * me(@CurrentUser() user: JwtPayload) { ... }
 *
 * // 2. Get a specific property from the payload (e.g., the user ID):
 * myWills(@CurrentUser('sub') userId: string) { ... }
 */
export declare const CurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof JwtPayload | undefined)[]) => ParameterDecorator;
//# sourceMappingURL=current-user.decorator.d.ts.map