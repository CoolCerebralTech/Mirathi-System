// application/guardianship/queries/impl/get-ward-guardianships.query.ts
import { BaseQuery } from '../base.query';

export class GetWardGuardianshipsQuery extends BaseQuery {
  public readonly wardId: string;
  public readonly includeDissolved: boolean;

  constructor(
    props: { wardId: string; includeDissolved?: boolean },
    baseProps: { userId: string; correlationId?: string },
  ) {
    super(baseProps);
    this.wardId = props.wardId;
    this.includeDissolved = props.includeDissolved ?? false;

    if (!this.wardId) throw new Error('Ward ID is required');
  }
}
