import { WillType } from '@prisma/client';

export class WillCreatedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly title: string,
    public readonly type: WillType, // Added: Critical for distinguishing Standard vs Holographic etc.
    public readonly version: number = 1,
    public readonly timestamp: Date = new Date(),
  ) {}
}
