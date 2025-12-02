// get-will-documents.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillDocumentsQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
