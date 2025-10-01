import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly reflector;
    constructor(reflector: Reflector);
    /**
     * This method is the entry point for the guard.
     * It first checks if the route is marked as @Public().
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    /**
     * This method is called by the underlying Passport strategy after it has
     * validated (or failed to validate) the token.
     */
    handleRequest<TUser = any>(err: any, user: any, info: any): TUser;
}
export {};
//# sourceMappingURL=jwt-auth.guard.d.ts.map