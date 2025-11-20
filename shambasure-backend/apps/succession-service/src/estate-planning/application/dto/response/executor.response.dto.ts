import { Exclude, Expose, Type } from 'class-transformer';
import { ExecutorStatus } from '@prisma/client';
import { AssetValueResponse } from './asset.response.dto';

@Exclude()
export class ExecutorInfoResponse {
  @Expose() userId?: string;
  @Expose() fullName: string;
  @Expose() email?: string;
  @Expose() phone?: string;
  @Expose() relationship?: string;
  @Expose() address?: any; // Keeping generic for JSON structure
}

@Exclude()
export class ExecutorResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => ExecutorInfoResponse)
  info: ExecutorInfoResponse;

  @Expose()
  isPrimary: boolean;

  @Expose()
  orderOfPriority: number;

  @Expose()
  status: ExecutorStatus;

  // Compensation (Only show if applicable)
  @Expose()
  isCompensated: boolean;

  @Expose()
  @Type(() => AssetValueResponse)
  compensationAmount?: AssetValueResponse;

  // Dates
  @Expose()
  appointedAt?: Date;

  @Expose()
  acceptedAt?: Date;

  @Expose()
  declinedAt?: Date;

  @Expose()
  declineReason?: string;
}
