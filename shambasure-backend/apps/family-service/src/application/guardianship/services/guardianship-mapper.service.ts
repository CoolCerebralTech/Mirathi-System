// src/application/guardianship/services/guardianship-mapper.service.ts
import { Injectable } from '@nestjs/common';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { GuardianshipRiskService } from '../../../domain/aggregates/guardianship.aggregate';
import { GuardianAssignmentEntity } from '../../../domain/entities/guardian-assignment.entity';
import {
  GuardianSummary,
  GuardianshipDetailsReadModel,
} from '../queries/read-models/guardianship-details.read-model';
import { GuardianshipListItemReadModel } from '../queries/read-models/guardianship-list-item.read-model';

@Injectable()
export class GuardianshipMapperService {
  /**
   * Maps an Aggregate to a full detailed view (Case File)
   */
  public toDetailsReadModel(aggregate: GuardianshipAggregate): GuardianshipDetailsReadModel {
    const props = (aggregate as any).props;
    const activeGuardians = aggregate.getActiveGuardians();

    return new GuardianshipDetailsReadModel({
      id: aggregate.id.toString(),
      caseNumber: props.caseNumber || 'PENDING_ALLOCATION',
      status: props.status,

      ward: {
        id: props.wardReference.memberId,
        name: props.wardFullName,
        age: props.wardReference.getAge(),
        dateOfBirth: props.wardDateOfBirth,
        gender: props.wardReference.gender,
        photoUrl: undefined, // Would come from Media Service
      },

      legal: {
        type: props.guardianshipType.getDescription(),
        jurisdiction: props.jurisdiction,
        courtStation: props.courtOrder?.getValue().courtStation || 'N/A',
        judgeName: props.courtOrder?.getValue().judgeName,
        orderDate: props.courtOrder?.getValue().orderDate,
      },

      guardians: activeGuardians.map((g) => this.toGuardianSummary(g)),

      compliance: {
        score: this.calculateComplianceScore(aggregate),
        lastReportDate: this.getLastReportDate(aggregate),
        nextReportDue: aggregate.getNextComplianceDue() || new Date(),
        isBonded: props.bondStatus === 'POSTED',
      },
    });
  }

  /**
   * Maps an Aggregate to a lightweight list item (Dashboard Table)
   */
  public toListItemReadModel(aggregate: GuardianshipAggregate): GuardianshipListItemReadModel {
    const props = (aggregate as any).props;
    const primary = aggregate.getPrimaryGuardian();
    const risk = GuardianshipRiskService.assessRisk(aggregate);

    return new GuardianshipListItemReadModel({
      id: aggregate.id.toString(),
      caseNumber: props.caseNumber || 'N/A',
      wardName: props.wardFullName,
      wardAge: props.wardReference.getAge(),
      primaryGuardianName: primary ? (primary as any).props.guardianName : 'Unassigned',
      status: props.status,
      riskLevel: risk.level,
      nextComplianceDue: aggregate.getNextComplianceDue() || new Date(),
      establishedDate: props.establishedDate,
    });
  }

  // --- Helpers ---

  private toGuardianSummary(entity: GuardianAssignmentEntity): GuardianSummary {
    const props = (entity as any).props;
    return {
      guardianId: props.guardianId,
      name: props.guardianName,
      role: props.role,
      isPrimary: props.isPrimary,
      status: props.status,
      contactPhone: props.contactInfo.getFormattedPhone('LOCAL'),
      relationshipToWard: 'Guardian', // Placeholder until Family Graph lookup
    };
  }

  private calculateComplianceScore(aggregate: GuardianshipAggregate): number {
    const summary = aggregate.getComplianceSummary();
    if (summary.totalChecks === 0) return 100; // Innocent until proven guilty
    // Simple logic: submitted / total * 100
    return Math.round((summary.submittedChecks / summary.totalChecks) * 100);
  }

  private getLastReportDate(aggregate: GuardianshipAggregate): Date | undefined {
    // Logic to find last submitted check date
    return undefined; // Placeholder
  }
}
