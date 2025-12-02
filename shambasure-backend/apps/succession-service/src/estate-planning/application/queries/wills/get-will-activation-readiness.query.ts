// get-will-activation-readiness.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillActivationReadinessQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
