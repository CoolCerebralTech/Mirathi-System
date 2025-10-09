import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@shamba/common';

export const ROLES_KEY = 'roles';

/**
 * A decorator to specify which roles are required to access a specific route.
 * To be used in conjunction with the `RolesGuard`.
 * @param roles The list of roles allowed to access the endpoint.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
