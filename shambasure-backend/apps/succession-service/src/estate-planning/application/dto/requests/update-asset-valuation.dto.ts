import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAssetValuationDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string = 'KES';

  @IsDate()
  @Type(() => Date)
  valuationDate: Date;

  @IsString()
  @IsOptional()
  valuationSource?: string;
}
