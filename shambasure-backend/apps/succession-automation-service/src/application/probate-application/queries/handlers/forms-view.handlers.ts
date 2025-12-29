import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FormStatus, GeneratedForm } from '../../../../domain/entities/generated-form.entity';
import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import { Result } from '../../../common/result';
import { GetGeneratedFormsQuery } from '../impl/probate.queries';
import { FormBundleVm, FormItemVm } from '../view-models/form-bundle.vm';

@QueryHandler(GetGeneratedFormsQuery)
export class GetGeneratedFormsHandler implements IQueryHandler<GetGeneratedFormsQuery> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(query: GetGeneratedFormsQuery): Promise<Result<FormBundleVm>> {
    const { dto } = query;
    const application = await this.repository.findById(dto.applicationId);

    if (!application) return Result.fail('Application not found');

    const forms = application.forms; // Entities

    // Helper to map Entity -> VM
    const mapFormToVm = (form: GeneratedForm): FormItemVm => ({
      id: form.id.toString(),
      code: form.formCode,
      name: form.displayName,
      status: form.status,
      // Note: Category isn't stored directly on Entity props in the version shared,
      // but usually available via VO lookup. For now, inferring or assuming prop exists.
      category: 'GENERAL',

      version: form.currentVersion,
      generatedAt: form.generatedAt,

      downloadUrl: form.getDownloadUrl(),
      previewUrl: form.getPreviewUrl(),

      canSign: form.needsSignatures(),
      canRegenerate: form.status !== FormStatus.SIGNED && form.status !== FormStatus.FILED,

      signaturesRequired: form.requiredSignatories,
      signaturesObtained: form.getSignaturesCount(),
      signatories: form.signatures.map((s) => ({
        signatoryName: s.signatoryName,
        role: 'Signatory', // Would need lookup
        hasSigned: true,
        signedAt: s.signedAt,
        signatureType: s.signatureType,
      })),

      rejectionReason:
        form.status === FormStatus.COURT_REJECTED ? 'Court rejected this form' : undefined,
    });

    const vms = forms.map(mapFormToVm);

    // Grouping
    const bundle: FormBundleVm = {
      applicationId: application.id.toString(),

      primaryPetitions: vms.filter(
        (f) => f.code.includes('Petition') || f.code.includes('P&A 80') || f.code.includes('P&A 1'),
      ),
      affidavits: vms.filter((f) => f.name.includes('Affidavit')),
      consentsAndGuarantees: vms.filter(
        (f) => f.name.includes('Consent') || f.name.includes('Guarantee'),
      ),
      others: vms.filter(
        (f) =>
          !f.code.includes('Petition') &&
          !f.name.includes('Affidavit') &&
          !f.name.includes('Consent'),
      ),

      allApproved: application.getApprovedForms().length === forms.length,
      allSigned: application.areAllFormsReady(),
    };

    return Result.ok(bundle);
  }
}
