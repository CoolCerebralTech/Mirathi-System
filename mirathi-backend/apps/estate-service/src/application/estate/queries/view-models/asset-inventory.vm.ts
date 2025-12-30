import { AssetStatus } from '../../../../domain/enums/asset-status.enum';
import { AssetType } from '../../../../domain/enums/asset-type.enum';
import { MoneyVM } from './estate-dashboard.vm';

export class AssetInventoryItemVM {
  id: string;
  name: string;
  type: AssetType;
  description?: string;

  // Financials
  currentValue: MoneyVM;

  // Status
  status: AssetStatus;
  isEncumbered: boolean;
  encumbranceDetails?: string; // e.g., "Charged to KCB Bank"

  // Ownership
  isCoOwned: boolean;
  estateSharePercentage: number; // Usually 100%, unless Tenancy in Common

  // Specific Details (Simplified for list view)
  identifier: string; // Title No, Plate No, Account No
  location?: string;
}

export class AssetInventoryVM {
  items: AssetInventoryItemVM[];
  totalValue: MoneyVM;
  totalCount: number;

  liquidAssetsValue: MoneyVM; // How much can be easily sold?
  illiquidAssetsValue: MoneyVM; // Land, etc.
}
