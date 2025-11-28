import { GuardianType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class GuardianshipResponseDto {
  @Expose()
  id: string;

  @Expose()
  guardianId: string;

  @Expose()
  wardId: string;

  @Expose()
  type: GuardianType;

  @Expose()
  appointmentDate: Date;

  @Expose()
  validUntil?: Date;

  @Expose()
  isActiveRecord: boolean; // System status

  @Expose()
  get isValid(): boolean {
    // Computed status based on date logic
    if (!this.isActiveRecord) return false;
    if (this.validUntil && new Date() > this.validUntil) return false;
    return true;
  }
}
