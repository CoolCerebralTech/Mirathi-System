import { AssetValue } from '../../estate-planning/domain/value-objects/asset-value.vo';
import { COURT_JURISDICTION } from '../../common/constants/court-jurisdiction.constants';

export class EstateValuation {
  private readonly grossValue: AssetValue;
  private readonly netValue: AssetValue;
  private readonly valuationDate: Date;

  constructor(gross: AssetValue, net: AssetValue, date: Date = new Date()) {
    if (gross.getCurrency() !== 'KES' || net.getCurrency() !== 'KES') {
      throw new Error('Court jurisdiction calculations require value in KES.');
    }
    this.grossValue = gross;
    this.netValue = net;
    this.valuationDate = date;
  }

  /**
   * Returns the required Court Level based on Pecuniary Jurisdiction.
   * (High Court vs Magistrate)
   */
  getRequiredCourtLevel(): 'HIGH_COURT' | 'MAGISTRATE_COURT' {
    // Threshold is KES 5,000,000 (subject to CJ Practice Directions)
    const threshold = COURT_JURISDICTION.HIGH_COURT.minJurisdiction;
    
    if (this.grossValue.getAmount() >= threshold) {
      return 'HIGH_COURT';
    }
    return 'MAGISTRATE_COURT';
  }

  getGrossAmount(): number {
    return this.grossValue.getAmount();
  }

  getNetAmount(): number {
    return this.netValue.getAmount();
  }

  toString(): string {
    return `Gross: ${this.grossValue.toString()}, Net: ${this.netValue.toString()}`;
  }
}
