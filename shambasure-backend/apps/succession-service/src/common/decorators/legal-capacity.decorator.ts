import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const LegalCapacity = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  // Kenyan law: Testator must be 18+ years and of sound mind
  const isOfAge = user.age >= 18;
  const isSoundMind = !user.mentalIncapacity;

  return {
    isOfAge,
    isSoundMind,
    isValid: isOfAge && isSoundMind,
    requirements: {
      minAge: 18,
      soundMind: true,
    },
  };
});

// Decorator to validate legal capacity in controllers
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_LEGAL_CAPACITY = 'require-legal-capacity';
export const RequireLegalCapacity = () => SetMetadata(REQUIRE_LEGAL_CAPACITY, true);
