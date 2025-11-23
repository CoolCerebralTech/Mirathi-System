import { DisputeType } from '@prisma/client';

export class DisputeFiledEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly disputantId: string,
    public readonly type: DisputeType,
    public readonly description: string,
    public readonly legalGrounds: string[],
    public readonly evidenceCount: number,
  ) {}

  getEventType(): string {
    return 'DisputeFiledEvent';
  }

  getPayload() {
    return {
      disputeId: this.disputeId,
      willId: this.willId,
      disputantId: this.disputantId,
      type: this.type,
      description: this.description,
      legalGrounds: this.legalGrounds,
      evidenceCount: this.evidenceCount,
    };
  }
}
