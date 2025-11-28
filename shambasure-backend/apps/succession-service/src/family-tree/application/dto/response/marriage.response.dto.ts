import { MarriageStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MarriageResponseDto {
  @Expose()
  id: string;

  @Expose()
  spouse1Id: string;

  @Expose()
  spouse2Id: string;

  @Expose()
  marriageType: MarriageStatus;

  @Expose()
  marriageDate: Date;

  @Expose()
  isActive: boolean;

  @Expose()
  certificateNumber?: string;

  @Expose()
  divorceDate?: Date;

  @Expose()
  get isPolygamousType(): boolean {
    return ['CUSTOMARY_MARRIAGE', 'ISLAMIC_MARRIAGE'].includes(this.marriageType);
  }
}
