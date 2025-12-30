import { IQuery } from '@nestjs/cqrs';

// You might need to create this simple DTO if not exists, or use GetEstateByIdDto
import { GetEstateByIdDto } from '../dtos/estate/get-estate-by-id.dto';
import { CheckSolvencyDto } from '../dtos/financials/check-solvency.dto';

export class GetEstateDashboardQuery implements IQuery {
  constructor(
    public readonly dto: GetEstateByIdDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}

export class CheckSolvencyQuery implements IQuery {
  constructor(
    public readonly dto: CheckSolvencyDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
