import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of this File
// ============================================================================
// This file defines the base shape for API *response* DTOs. These classes are
// not used for input validation (e.g., in request bodies). Their purpose is to
// provide a consistent structure and clear API documentation for the data
// our services return to clients.
//
// The `AuditableDto` has been intentionally REMOVED. Our current Prisma schema
// does not include `createdBy` or `updatedBy` fields on the core models. A DTO
// in this shared library MUST accurately represent the data contract of our
// system. If we decide to add these auditing fields to our database models in
// the future, we can re-introduce a corresponding DTO at that time.
// This prevents a mismatch between our API contract and the actual data.
// ============================================================================

export class BaseResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the resource.',
    example: 'clq1a2b3c0000d4e5f6g7h8i9',
    type: String,
  })
  id!: string;

  @ApiProperty({
    description: 'The ISO 8601 timestamp when the resource was created.',
    example: '2023-12-01T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'The ISO 8601 timestamp when the resource was last updated.',
    example: '2023-12-01T11:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;
}
