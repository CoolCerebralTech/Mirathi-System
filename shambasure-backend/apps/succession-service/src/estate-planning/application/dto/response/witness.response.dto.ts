import { Exclude, Expose, Type } from 'class-transformer';
import { WitnessStatus } from '@prisma/client';

@Exclude()
export class WitnessInfoResponse {
  @Expose() userId?: string;
  @Expose() fullName: string;
  @Expose() email?: string;
  @Expose() phone?: string;
  // Note: We intentionally do NOT expose 'idNumber' here for general privacy.
  // It should only be visible in specific Admin/Verification endpoints.
}

@Exclude()
export class WitnessResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => WitnessInfoResponse)
  info: WitnessInfoResponse;

  @Expose()
  status: WitnessStatus;

  @Expose()
  signedAt?: Date;

  @Expose()
  verifiedAt?: Date;

  @Expose()
  verifiedBy?: string;

  @Expose()
  rejectionReason?: string;
}
