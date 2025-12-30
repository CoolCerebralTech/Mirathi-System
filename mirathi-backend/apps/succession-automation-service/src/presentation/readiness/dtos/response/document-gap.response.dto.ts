import { ApiProperty } from '@nestjs/swagger';

import {
  DocumentGapSeverity,
  DocumentGapType,
} from '../../../../domain/value-objects/document-gap.vo';

export class DocumentGapResponseDto {
  @ApiProperty({ enum: DocumentGapType, example: DocumentGapType.DEATH_CERTIFICATE })
  type: DocumentGapType;

  @ApiProperty({ enum: DocumentGapSeverity, example: DocumentGapSeverity.CRITICAL })
  severity: DocumentGapSeverity;

  @ApiProperty({ example: 'Death Certificate is missing' })
  description: string;

  @ApiProperty({ example: 'S.56 LSA - Mandatory for filing' })
  legalBasis: string;

  @ApiProperty({
    description: 'Step-by-step instructions for the user',
    example: 'Visit Civil Registration Office with ID and KES 50.',
  })
  obtainingInstructions: string;

  @ApiProperty({ description: 'Estimated days to obtain', example: 3 })
  estimatedTimeDays: number;

  @ApiProperty({ example: 'Affidavit of loss' })
  alternativeOptions?: string;

  @ApiProperty({ example: false })
  isWaivable: boolean;

  @ApiProperty({ example: '⛔ CRITICAL: You cannot file without this document.' })
  urgencyMessage: string;
}
