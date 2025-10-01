import { UserRole } from '@shamba/common';
export declare const ROLES_KEY = "roles";
/**
 * A decorator to specify which roles are required to access a specific route.
 * To be used in conjunction with the `RolesGuard`.
 * @param roles The list of roles allowed to access the endpoint.
 */
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=roles.decorator.d.ts.map