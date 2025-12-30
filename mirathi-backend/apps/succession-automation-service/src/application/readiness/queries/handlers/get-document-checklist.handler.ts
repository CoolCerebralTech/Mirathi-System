import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { DocumentGapSeverity } from '../../../../domain/value-objects/document-gap.vo';
import { GetDocumentChecklistQuery } from '../impl/get-document-checklist.query';
import { ChecklistItemVM, FilingChecklistVM } from '../view-models/filing-checklist.vm';

@QueryHandler(GetDocumentChecklistQuery)
export class GetDocumentChecklistHandler implements IQueryHandler<GetDocumentChecklistQuery> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(query: GetDocumentChecklistQuery): Promise<FilingChecklistVM> {
    const { assessmentId, estateId } = query.dto;

    let assessment;
    if (assessmentId) assessment = await this.repository.findById(assessmentId);
    else if (estateId) assessment = await this.repository.findByEstateId(estateId);

    if (!assessment) throw new NotFoundException('Assessment not found');

    const missingDocs = assessment.missingDocuments;

    const vm = new FilingChecklistVM();
    vm.categories = {
      identity: [],
      financial: [],
      courtForms: [],
      supporting: [],
    };

    // Categorize Gaps
    let mandatoryCount = 0;

    missingDocs.forEach((gap) => {
      const item = new ChecklistItemVM();
      item.documentName = gap.type.replace(/_/g, ' ');
      item.description = gap.description;
      item.isMandatory = gap.isBlocking() || gap.severity === DocumentGapSeverity.HIGH;
      item.isProvided = false; // It's in the missing list, so false
      item.howToObtain = gap.obtainingInstructions;
      item.severity = gap.severity;

      if (item.isMandatory) mandatoryCount++;

      // Simple categorization logic
      if (
        ['DEATH_CERTIFICATE', 'NATIONAL_ID', 'BIRTH_CERTIFICATE'].some((t) => gap.type.includes(t))
      ) {
        vm.categories.identity.push(item);
      } else if (['BANK', 'TAX', 'KRA'].some((t) => gap.type.includes(t))) {
        vm.categories.financial.push(item);
      } else if (['CONSENT', 'AFFIDAVIT', 'GUARANTEE'].some((t) => gap.type.includes(t))) {
        vm.categories.courtForms.push(item);
      } else {
        vm.categories.supporting.push(item);
      }
    });

    vm.mandatoryMissingCount = mandatoryCount;
    vm.readyToPrint = mandatoryCount === 0;
    // Simple progress heuristic (assuming 10 standard docs, subtracting missing)
    vm.totalProgress = Math.max(0, 100 - missingDocs.length * 10);

    return vm;
  }
}
