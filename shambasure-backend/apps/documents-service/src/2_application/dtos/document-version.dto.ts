import { IsString, IsOptional, IsNumber, Min, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  changeNote?: string;
}

export class DocumentVersionQueryDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
