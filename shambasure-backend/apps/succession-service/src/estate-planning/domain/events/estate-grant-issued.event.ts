import { IEvent } from '@nestjs/cqrs';
import { GrantType } from '@prisma/client';

/**
 * Event emitted when grant of representation is issued by court.
 *
 * Legal Context:
 * - Section 45-66: Grant of Probate or Letters of Administration
 * - Grant allows administrator to act on behalf of estate
 *
 * Triggers:
 * - Begin asset distribution process
 * - Settle outstanding debts
 * - Issue executor powers
 * - Gazette publication (if required)
 * - Creditor claim period starts
 */
export class EstateGrantIssuedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly grantNumber: string,
    public readonly grantType: GrantType,
    public readonly administratorId: string,
    public readonly issuedAt: Date,
    public readonly courtStation: string,
  ) {}
}
