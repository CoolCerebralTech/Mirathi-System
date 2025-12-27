import { Will } from '../../../../domain/aggregates/will.aggregate';
import { WillStatus } from '../../../../domain/enums/will-status.enum';

/**
 * Executor Dashboard Item View Model
 */
export class ExecutorDashboardItemVm {
  public willId: string;
  public testatorId: string;
  public willStatus: WillStatus;

  public myRole: 'PRIMARY' | 'SUBSTITUTE' | 'CO_EXECUTOR';
  public myOrder?: number;
  public appointmentDate: string;

  public consentStatus: 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN';
  public isQualified: boolean;
  public disqualificationRisk?: string;

  public compensationSummary: string;
  public actionRequired: boolean;
  public actionLabel?: string;

  public static fromDomain(will: Will, executorIdentifier: string): ExecutorDashboardItemVm | null {
    const assignment = will.executors.find((ex) => {
      const identity = ex.executorIdentity;

      if (identity.type === 'USER' && identity.userId === executorIdentifier) {
        return true;
      }

      if (identity.type === 'EXTERNAL' && identity.externalDetails) {
        return (
          identity.externalDetails.email === executorIdentifier ||
          identity.externalDetails.nationalId === executorIdentifier ||
          identity.externalDetails.phone === executorIdentifier
        );
      }

      return false;
    });

    if (!assignment) {
      return null;
    }

    const vm = new ExecutorDashboardItemVm();
    vm.willId = will.id.toString();
    vm.testatorId = will.testatorId;
    vm.willStatus = will.status;

    // Role Details
    // Cast strict domain enum to string/union
    vm.myRole = assignment.priority.level as 'PRIMARY' | 'SUBSTITUTE' | 'CO_EXECUTOR';
    vm.myOrder = assignment.priority.order;
    vm.appointmentDate = assignment.appointmentDate.toISOString();

    // 🛠️ FIX: Explicitly cast the string from domain to the specific Union Type
    vm.consentStatus =
      (assignment.consentStatus as 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN') || 'UNKNOWN';

    vm.isQualified = assignment.isLegallyQualified();

    // Risk/Disqualification
    if (!vm.isQualified) {
      if (assignment.isMinor) vm.disqualificationRisk = 'Minor';
      else if (assignment.isBankrupt) vm.disqualificationRisk = 'Bankrupt';
      else if (assignment.hasCriminalRecord) vm.disqualificationRisk = 'Criminal Record';
      else vm.disqualificationRisk = 'Other Disqualification';
    }

    // Compensation
    if (assignment.compensation?.isEntitled) {
      if (assignment.compensation.basis === 'FIXED') {
        vm.compensationSummary = `Fixed Amount: ${assignment.compensation.amount}`;
      } else if (assignment.compensation.basis === 'PERCENTAGE') {
        vm.compensationSummary = `${assignment.compensation.amount}% of Estate`;
      } else {
        vm.compensationSummary = 'Reasonable Expenses';
      }
    } else {
      vm.compensationSummary = 'Uncompensated (Voluntary)';
    }

    // Calculate Action Required
    vm.actionRequired = false;

    if (will.status === WillStatus.DRAFT) {
      if (vm.consentStatus === 'PENDING' || vm.consentStatus === 'UNKNOWN') {
        vm.actionRequired = true;
        vm.actionLabel = 'Provide Consent';
      } else {
        vm.actionLabel = 'Waiting for Testator';
      }
    } else if (will.status === WillStatus.ACTIVE || will.status === WillStatus.WITNESSED) {
      vm.actionLabel = 'Standby (Will Executed)';
    } else if (will.status === WillStatus.REVOKED) {
      vm.actionLabel = 'None (Will Revoked)';
    }

    return vm;
  }
}
