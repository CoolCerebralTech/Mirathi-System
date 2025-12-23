// application/guardianship/queries/impl/get-bond-expiry-dashboard.query.ts
import { BaseQuery } from '../base.query';

export interface BondExpiryFilters {
  expiringWithinDays?: number; // e.g., 30, 60, 90
  courtStation?: string; // Filter by jurisdiction
}

/**
 * Admin/Court dashboard query to find "at-risk" bonds.
 */
export class GetBondExpiryDashboardQuery extends BaseQuery {
  public readonly filters: BondExpiryFilters;

  constructor(filters: BondExpiryFilters, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.filters = filters;
  }
}
