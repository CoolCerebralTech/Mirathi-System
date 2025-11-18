// estate-planning/application/commands/nominate-executor.command.ts
export class NominateExecutorCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly executorType: 'USER' | 'EXTERNAL',
    public readonly executorId?: string, // userId
    public readonly externalExecutor?: {
      fullName: string;
      email: string;
      phone: string;
      relationship?: string;
      address?: {
        street?: string;
        city?: string;
        county?: string;
      };
    },
    public readonly isPrimary: boolean = false,
    public readonly orderOfPriority: number = 1,
    public readonly isCompensated: boolean = false,
    public readonly compensationAmount?: number,
  ) {}
}
