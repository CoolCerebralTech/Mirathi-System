import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RemoveExecutorDto {
  @IsString()
  @IsNotEmpty()
  removalReason: string;

  @IsString()
  @IsOptional()
  removedBy?: string;
}
