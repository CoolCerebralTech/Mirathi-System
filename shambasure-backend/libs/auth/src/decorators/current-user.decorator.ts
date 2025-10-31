import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtPayload } from '../interfaces/auth.interface';

// Utility type to get the value types of an object.
type ValueOf<T> = T[keyof T];

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | ValueOf<JwtPayload> => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'User not found in request context. Make sure the JwtAuthGuard is applied to this route.',
      );
    }

    // The logic remains the same, but now the linter understands its return type.
    return data ? user[data] : user;
  },
);
