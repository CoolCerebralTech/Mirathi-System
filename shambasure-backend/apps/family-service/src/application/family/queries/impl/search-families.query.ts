import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query for finding families in the system.
 */
export class SearchFamiliesQuery extends BaseQuery {
  public readonly page: number;
  public readonly pageSize: number;

  // Filters
  public readonly searchText?: string;
  public readonly county?: KenyanCounty;
  public readonly clanName?: string;
  public readonly isPolygamous?: boolean;
  public readonly creatorId?: string; // "My Families"

  constructor(props: {
    userId: string;
    page?: number;
    pageSize?: number;
    searchText?: string;
    county?: KenyanCounty;
    clanName?: string;
    isPolygamous?: boolean;
    creatorId?: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.page = props.page || 1;
    this.pageSize = props.pageSize || 10;
    this.searchText = props.searchText;
    this.county = props.county;
    this.clanName = props.clanName;
    this.isPolygamous = props.isPolygamous;
    this.creatorId = props.creatorId;
  }
}
