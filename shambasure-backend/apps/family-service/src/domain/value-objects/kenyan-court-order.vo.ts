// src/domain/value-objects/kenyan-court-order.vo.ts
import { ValueObject } from '../base/value-object';

export interface KenyanCourtOrderProps {
  caseNumber: string;
  courtStation: string;
  judgeName?: string;
  orderDate: Date;
  orderType: string; // e.g., "GUARDIANSHIP", "ADOPTION", "CUSTODY"

  // 🎯 INNOVATIVE: Digital court integration
  eFilingReference?: string;
  courtRegistryCode?: string;
  scannedCopyUrl?: string;
}

export class KenyanCourtOrderVO extends ValueObject<KenyanCourtOrderProps> {
  // Common Kenyan court stations
  private static readonly VALID_STATIONS = [
    'HIGH COURT',
    'CHILDRENS COURT',
    'KADHIS COURT',
    'CHIEF MAGISTRATE',
    'PRINCIPAL MAGISTRATE',
  ];

  constructor(props: KenyanCourtOrderProps) {
    super(props);
  }

  protected validate(): void {
    // Validate case number format (e.g., ELC No. 123 of 2024)
    if (!/^[A-Z]+\s*(No\.|Case|Petition)?\s*\d+\s+of\s+\d{4}$/i.test(this.props.caseNumber)) {
      throw new Error(`Invalid case number format: ${this.props.caseNumber}`);
    }

    if (!KenyanCourtOrderVO.VALID_STATIONS.includes(this.props.courtStation.toUpperCase())) {
      throw new Error(`Invalid court station: ${this.props.courtStation}`);
    }

    if (this.props.orderDate > new Date()) {
      throw new Error('Order date cannot be in the future');
    }
  }

  // 🎯 INNOVATIVE: Check if order is still valid (not appealed/revoked)
  public isValid(): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Assumption: Court orders typically valid for 1 year unless specified
    return this.props.orderDate > oneYearAgo;
  }

  // 🎯 INNOVATIVE: Generate court reference for filing
  public getCourtReference(): string {
    return `${this.props.courtStation.toUpperCase().replace(/\s+/g, '_')}_${this.props.caseNumber.replace(/\s+/g, '_')}`;
  }

  // 🎯 INNOVATIVE: Check if from Kadhi's Court (Islamic law)
  public isFromKadhisCourt(): boolean {
    return this.props.courtStation.toUpperCase().includes('KADHI');
  }

  public static create(props: KenyanCourtOrderProps): KenyanCourtOrderVO {
    return new KenyanCourtOrderVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.props,
      isValid: this.isValid(),
      courtReference: this.getCourtReference(),
      isFromKadhisCourt: this.isFromKadhisCourt(),
    };
  }
}
