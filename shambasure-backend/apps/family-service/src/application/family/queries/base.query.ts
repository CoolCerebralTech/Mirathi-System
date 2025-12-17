// application/family/queries/base.query.ts
import { IQuery } from '../../common/interfaces/use-case.interface';

export abstract class BaseQuery implements IQuery {
  abstract readonly queryId: string;
  abstract readonly timestamp: Date;
  abstract readonly correlationId?: string;
  abstract readonly userId: string;
}
