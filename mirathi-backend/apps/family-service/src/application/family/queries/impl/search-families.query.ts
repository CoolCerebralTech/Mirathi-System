import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query for finding families in the system.
 *
 * Performance Note:
 * This query hits a "Read Projection" (Lightweight table), NOT the Event Store.
 * It is optimized for filtering and pagination.
 */
export class SearchFamiliesQuery extends BaseQuery {
  public readonly page: number;
  public readonly pageSize: number;

  // Filters
  public readonly searchText?: string;
  public readonly county?: KenyanCounty;
  public readonly clanName?: string;
  public readonly isPolygamous?: boolean;
  public readonly creatorId?: string; // "My Families" context

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
    // Default to Page 1, Size 10
    this.page = props.page && props.page > 0 ? props.page : 1;
    this.pageSize = props.pageSize && props.pageSize > 0 ? props.pageSize : 10;

    this.searchText = props.searchText;
    this.county = props.county;
    this.clanName = props.clanName;
    this.isPolygamous = props.isPolygamous;
    this.creatorId = props.creatorId;
  }

  /**
   * Defensive validation to protect the read database
   */
  public validate(): void {
    if (this.pageSize > 100) {
      throw new Error('Page size cannot exceed 100 records.');
    }
    if (this.searchText && this.searchText.length > 50) {
      throw new Error('Search text is too long.');
    }
  }
}
