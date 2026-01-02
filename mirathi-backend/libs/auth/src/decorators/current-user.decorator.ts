import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

import { JwtPayload } from '../interfaces/auth.interface';

type ValueOf<T> = T[keyof T];

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | ValueOf<JwtPayload> => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'User not found in request context. Ensure JwtAuthGuard is applied to this route.',
      );
    }

    return data ? user[data] : user;
  },
);
