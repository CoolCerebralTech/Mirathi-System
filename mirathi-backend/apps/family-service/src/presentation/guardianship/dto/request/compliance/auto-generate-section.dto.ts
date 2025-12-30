import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum DataSource {
  SCHOOL_RECORDS = 'SCHOOL_RECORDS',
  MEDICAL_HISTORY = 'MEDICAL_HISTORY',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS', // e.g. M-Pesa / Bank
  PREVIOUS_REPORTS = 'PREVIOUS_REPORTS',
  INTERVIEW_TRANSCRIPT = 'INTERVIEW_TRANSCRIPT',
}

export class AutoGenerateSectionDto {
  @ApiProperty({
    description: 'The specific section ID to generate content for',
    example: 'financial-summary',
  })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({
    enum: DataSource,
    description: 'Where should the AI pull data from?',
  })
  @IsEnum(DataSource)
  dataSource: DataSource;
}
