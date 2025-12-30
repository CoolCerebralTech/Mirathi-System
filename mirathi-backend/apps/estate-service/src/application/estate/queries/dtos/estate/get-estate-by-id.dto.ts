import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetEstateByIdDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;
}
