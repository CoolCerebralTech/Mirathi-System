import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const Testator = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const TESTATOR_OWNERSHIP_METADATA = 'testator-ownership';
export const TestatorOwnership = (requireOwnership: boolean = true) =>
  SetMetadata(TESTATOR_OWNERSHIP_METADATA, requireOwnership);

// Resource ownership validation
export const OwnsResource = createParamDecorator(
  (data: { resourceType: string; paramName: string }, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[data.paramName];

    return {
      userId: user.id,
      resourceId,
      resourceType: data.resourceType,
      hasOwnership: true, // Will be validated in guard
    };
  },
);
