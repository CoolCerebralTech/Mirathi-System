import { ApiProperty } from '@nestjs/swagger';

class ChecklistItemDto {
  @ApiProperty({ example: 'Death Certificate' })
  documentName: string;

  @ApiProperty({ example: 'Original Death Certificate of the deceased' })
  description: string;

  @ApiProperty({ example: true })
  isMandatory: boolean;

  @ApiProperty({ example: false })
  isProvided: boolean;

  @ApiProperty({ example: 'Visit Civil Registration Office', required: false })
  howToObtain?: string;

  @ApiProperty({ example: 'CRITICAL' })
  severity: string;
}

class ChecklistCategoriesDto {
  @ApiProperty({ type: [ChecklistItemDto] })
  identity: ChecklistItemDto[];

  @ApiProperty({ type: [ChecklistItemDto] })
  financial: ChecklistItemDto[];

  @ApiProperty({ type: [ChecklistItemDto] })
  courtForms: ChecklistItemDto[];

  @ApiProperty({ type: [ChecklistItemDto] })
  supporting: ChecklistItemDto[];
}

export class FilingChecklistResponseDto {
  @ApiProperty({ example: false })
  readyToPrint: boolean;

  @ApiProperty({ description: 'Count of missing mandatory documents', example: 1 })
  mandatoryMissingCount: number;

  @ApiProperty({ description: 'Percentage completeness', example: 90 })
  totalProgress: number;

  @ApiProperty({ type: ChecklistCategoriesDto })
  categories: ChecklistCategoriesDto;
}
