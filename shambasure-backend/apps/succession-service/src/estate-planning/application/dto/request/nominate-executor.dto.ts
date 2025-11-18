// estate-planning/application/dto/request/nominate-executor.dto.ts
export class NominateExecutorRequestDto {
  executorType: 'USER' | 'EXTERNAL';
  executorId?: string;
  externalExecutor?: {
    fullName: string;
    email: string;
    phone: string;
    relationship?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
    };
  };
  isPrimary?: boolean;
  orderOfPriority?: number;
  isCompensated?: boolean;
  compensationAmount?: number;
}
