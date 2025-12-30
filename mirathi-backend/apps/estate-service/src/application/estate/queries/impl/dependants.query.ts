import { IQuery } from '@nestjs/cqrs';

import { GetEstateDependantsDto } from '../dtos/dependants/get-estate-dependants.dto';

export class GetEstateDependantsQuery implements IQuery {
  constructor(
    public readonly dto: GetEstateDependantsDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
