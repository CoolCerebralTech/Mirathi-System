import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class SetAssetLifeInterestDto {
  @IsString()
  @IsNotEmpty()
  lifeInterestHolderId: string;

  @IsDate()
  @Type(() => Date)
  lifeInterestEndsAt: Date;
}
