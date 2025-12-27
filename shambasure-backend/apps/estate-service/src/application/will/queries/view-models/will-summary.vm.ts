import { Will } from '../../../../domain/aggregates/will.aggregate';
import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

/**
 * Will Summary View Model
 *
 * PURPOSE:
 * Provides a concise overview of a Will for list displays or dashboards.
 * Includes key identifiers, status, and basic risk indicators.
 */
export class WillSummaryVm {
  public id: string;
  public testatorId: string;
  public status: WillStatus;
  public type: WillType;
  public createdAt: string;
  public isRevoked: boolean;
  public hasCodicils: boolean;
  public hasDisinheritance: boolean;
  public executionDate?: string;

  // Basic Risk Indicators
  public isValid: boolean;
  public validationErrorsCount: number;

  /**
   * Factory method to convert Domain Entity to View Model
   */
  public static fromDomain(will: Will): WillSummaryVm {
    const vm = new WillSummaryVm();

    vm.id = will.id.toString();
    vm.testatorId = will.testatorId;
    vm.status = will.status;
    vm.type = will.type;

    // Assuming createdAt is available on the Aggregate Root's props
    vm.createdAt = (will as any).props.createdAt?.toISOString() || new Date().toISOString();

    vm.isRevoked = will.isRevoked;
    vm.hasCodicils = will.codicils.length > 0;
    vm.hasDisinheritance = will.disinheritanceRecords.length > 0;
    vm.executionDate = will.executionDate?.toISOString();

    // Validation Summary
    vm.isValid = will.isValid;
    vm.validationErrorsCount = will.validationErrors.length;

    return vm;
  }
}
