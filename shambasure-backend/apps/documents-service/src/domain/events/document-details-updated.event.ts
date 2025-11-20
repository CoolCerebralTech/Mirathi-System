import { DomainEvent } from './base.event';
import { DocumentId, UserId } from '../value-objects';

export interface DocumentDetailsPayload {
  documentNumber?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  issuingAuthority?: string | null;
}

export class DocumentDetailsUpdatedEvent extends DomainEvent<DocumentId> {
  public readonly updatedBy: UserId;
  public readonly updates: Readonly<DocumentDetailsPayload>;

  constructor(aggregateId: DocumentId, updatedBy: UserId, updates: DocumentDetailsPayload) {
    // New events must provide eventName and eventVersion
    super(aggregateId, 'document.details.updated', 1);
    this.updatedBy = updatedBy;
    this.updates = updates;
  }
}
