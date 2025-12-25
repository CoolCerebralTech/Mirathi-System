// src/application/guardianship/queries/handlers/get-court-document-preview.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import {
  DocumentType,
  GetCourtDocumentPreviewQuery,
} from '../impl/get-court-document-preview.query';

@QueryHandler(GetCourtDocumentPreviewQuery)
export class GetCourtDocumentPreviewHandler extends BaseQueryHandler<
  GetCourtDocumentPreviewQuery,
  { content: string; metadata: any }
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetCourtDocumentPreviewQuery,
  ): Promise<Result<{ content: string; metadata: any }>> {
    try {
      const aggregate = await this.guardianshipRepo.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new AppErrors.NotFoundError('Guardianship', query.guardianshipId));
      }

      let documentData: any;

      // Route based on Document Type
      if (query.documentType === DocumentType.COMPLIANCE_REPORT) {
        const check = (aggregate as any).props.complianceChecks.find(
          (c: any) => c.id.toString() === query.referenceId,
        );
        if (!check) throw new AppErrors.NotFoundError('Compliance Report', query.referenceId);

        // Use Domain Entity Method
        documentData = check.generateCourtDocument(query.format);
      } else if (query.documentType === DocumentType.BOND_CERTIFICATE) {
        // Find the guardian assignment containing this bond
        // Note: Reference ID here is likely the Guardian Assignment ID in practice
        const assignment = aggregate
          .getActiveGuardians()
          .find((g: any) => g.props.bond?.getValue().bondReference === query.referenceId);

        if (!assignment || !(assignment as any).props.bond) {
          throw new AppErrors.NotFoundError('Bond Certificate', query.referenceId);
        }

        const bondVO = (assignment as any).props.bond;
        documentData = {
          content: JSON.stringify(bondVO.generateBondCertificate()),
          metadata: { type: 'BOND', generatedAt: new Date() },
        };
      } else {
        throw new Error(`Document type ${query.documentType} not supported yet`);
      }

      this.logSuccess(query, undefined, `Generated ${query.documentType}`);
      return Result.ok(documentData);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
