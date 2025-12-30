import { GiftStatus } from '../../../../domain/entities/gift-inter-vivos.entity';
import { AssetType } from '../../../../domain/enums/asset-type.enum';
import { MoneyVM } from './estate-dashboard.vm';

export class GiftItemVM {
  id: string;
  recipientId: string;
  description: string;
  assetType: AssetType;

  // Financials (S.35 Math)
  valueAtTimeOfGift: MoneyVM;
  hotchpotValue: MoneyVM; // value * multiplier

  // Status
  status: GiftStatus;
  isContested: boolean;
  isSubjectToHotchpot: boolean;

  dateGiven: Date;
}

export class GiftListVM {
  items: GiftItemVM[];
  totalHotchpotAddBack: MoneyVM; // The amount added to Distributable Pool
}
