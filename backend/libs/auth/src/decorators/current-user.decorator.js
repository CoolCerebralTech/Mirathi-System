"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
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
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    // The user object is attached to the request by Passport's JWT strategy.
    const user = request.user;
    // If a specific key is requested (e.g., 'sub'), return that property.
    // Otherwise, return the entire user payload object.
    return data ? user?.[data] : user;
});
//# sourceMappingURL=current-user.decorator.js.map