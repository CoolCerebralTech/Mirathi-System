import { BaseQuery } from '../../../common/base/base.query';
import { WillSearchDto } from '../dtos/will-search.dto';

/**
 * Advanced Multi-Criteria Search Query.
 * Wraps the complex search DTO.
 */
export class SearchWillsQuery extends BaseQuery {
  public readonly criteria: WillSearchDto;

  constructor(props: { criteria: WillSearchDto; userId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.criteria = props.criteria;
  }
}
