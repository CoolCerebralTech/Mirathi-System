// estate-planning/application/dto/response/executor.response.dto.ts
import { ExecutorStatus } from '@prisma/client';

export class ExecutorResponseDto {
  id: string;
  willId: string;
  executorInfo: {
    userId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    relationship?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
    };
  };
  isPrimary: boolean;
  orderOfPriority: number;
  status: ExecutorStatus;
  appointedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  isCompensated: boolean;
  compensationAmount?: number;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  executorName: string;
  isExternal: boolean;
  isActive: boolean;
  hasAccepted: boolean;
  canAct: boolean;
}
