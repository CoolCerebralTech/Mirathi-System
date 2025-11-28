// succession-service/src/succession-process/infrastructure/persistence/mappers/creditor-claim.mapper.ts

import { CreditorClaim as PrismaClaim } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
// Assuming we are using a generic CreditorClaim entity or Debt entity adaptation
// Here we assume a specific Entity exists based on previous prompts
import { CreditorClaim } from '../../../domain/entities/creditor-claim.entity';
import { AssetValue } from '../../../../estate-planning/domain/value-objects/asset-value.vo';

export class CreditorClaimMapper {
  static toPersistence(domain: CreditorClaim): PrismaClaim {
    const amount = domain.getAmountClaimed(); // Assuming returns AssetValue

    return {
      id: domain.getId(),
      estateId: domain.getEstateId(),

      creditorName: domain.getCreditorName(),
      amountClaimed: new Decimal(amount.getAmount()),
      currency: amount.getCurrency(),

      supportingDocumentId: domain.getDocumentId() || null,
      status: domain.getStatus(),

      resolvedAt: domain.getResolvedAt(),
      createdAt: new Date(),
    } as unknown as PrismaClaim;
  }

  static toDomain(raw: PrismaClaim): CreditorClaim {
    const amount = new AssetValue(Number(raw.amountClaimed), raw.currency);

    return CreditorClaim.reconstitute({
      id: raw.id,
      estateId: raw.estateId,
      creditorName: raw.creditorName,
      amountClaimed: amount,
      documentId: raw.supportingDocumentId,
      status: raw.status,
      resolvedAt: raw.resolvedAt,
      createdAt: raw.createdAt,
    });
  }
}
