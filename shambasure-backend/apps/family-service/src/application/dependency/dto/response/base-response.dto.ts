// application/dependency/dto/response/base-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

// Optional: For Swagger documentation

export class BaseResponseDto {
  @ApiProperty({ description: 'Success status of the operation' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Request ID for tracking', required: false })
  requestId?: string;

  @ApiProperty({ description: 'Timestamp of response' })
  timestamp: string;

  constructor(success: boolean, message: string, requestId?: string) {
    this.success = success;
    this.message = message;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponseDto<T> extends BaseResponseDto {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(
    data: T[],
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    },
    message: string = 'Success',
    requestId?: string,
  ) {
    super(true, message, requestId);
    this.data = data;
    this.meta = meta;
  }
}
