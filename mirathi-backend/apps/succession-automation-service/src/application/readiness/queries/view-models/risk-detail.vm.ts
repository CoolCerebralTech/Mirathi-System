import {
  RiskCategory,
  RiskSeverity,
  RiskStatus,
} from '../../../../domain/entities/risk-flag.entity';
import { DocumentGapType } from '../../../../domain/value-objects/document-gap.vo';

export class RiskDetailVM {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  category: RiskCategory;
  status: RiskStatus;

  // UI Helpers
  badgeColor: 'red' | 'orange' | 'yellow' | 'green' | 'gray';
  priorityLabel: string;
  icon: string;

  // Context
  legalBasis: string;
  mitigationSteps: string[];
  daysActive: number;

  // Linkage
  isBlocking: boolean;
  linkedDocumentType?: DocumentGapType;
  linkedEntityId?: string; // e.g., the specific Asset ID or Minor ID

  constructor(data: Partial<RiskDetailVM>) {
    Object.assign(this, data);
  }

  static fromDomain(risk: any): RiskDetailVM {
    return new RiskDetailVM({
      id: risk.id.toString(),
      title: risk.category.replace(/_/g, ' '), // Human readable title
      description: risk.description,
      severity: risk.severity,
      category: risk.category,
      status: risk.riskStatus,

      // Logic for UI rendering
      badgeColor: RiskDetailVM.getBadgeColor(risk.severity, risk.riskStatus),
      priorityLabel: risk.isBlocking ? 'BLOCKER' : risk.severity,
      icon: RiskDetailVM.getIcon(risk.category),

      legalBasis: risk.legalBasis,
      mitigationSteps: risk.mitigationSteps,
      daysActive: risk.getAgeInDays ? risk.getAgeInDays() : 0,

      isBlocking: risk.isBlocking,
      linkedDocumentType: risk.documentGap?.type,
      linkedEntityId: risk.affectedEntityIds?.[0],
    });
  }

  private static getBadgeColor(severity: RiskSeverity, status: RiskStatus): any {
    if (status === RiskStatus.RESOLVED) return 'green';
    if (status === RiskStatus.DISPUTED) return 'gray';

    switch (severity) {
      case RiskSeverity.CRITICAL:
        return 'red';
      case RiskSeverity.HIGH:
        return 'orange';
      case RiskSeverity.MEDIUM:
        return 'yellow';
      default:
        return 'gray';
    }
  }

  private static getIcon(category: RiskCategory): string {
    // Mapping categories to Material/FontAwesome icon names
    if (category.includes('DOCUMENT')) return 'file-document-alert';
    if (category.includes('MINOR')) return 'account-child-alert';
    if (category.includes('ASSET')) return 'home-alert';
    if (category.includes('WILL')) return 'file-sign';
    if (category.includes('TAX')) return 'bank-transfer';
    return 'alert-circle';
  }
}
