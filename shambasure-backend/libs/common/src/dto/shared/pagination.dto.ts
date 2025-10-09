import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type as NestType } from '@nestjs/common';

// --- Reusable Enum for Sorting ---
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Defines the standardized query parameters for pagination and sorting.
 * To be used in controller methods for GET requests on lists.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The page number to retrieve.',
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'The number of items to return per page.',
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'A search term to filter results.',
    type: String,
    example: 'Mwangi',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'The field to sort the results by.',
    type: String,
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'The direction to sort the results.',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}

/**
 * Defines the metadata for a paginated response.
 */
class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number.', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page.', example: 10 })
  limit!: number;

  @ApiProperty({
    description: 'Total number of items available.',
    example: 100,
  })
  total!: number;

  @ApiProperty({ description: 'Total number of pages available.', example: 10 })
  totalPages!: number;

  @ApiProperty({
    description: 'Indicates if there is a next page.',
    example: true,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: 'Indicates if there is a previous page.',
    example: false,
  })
  hasPrev!: boolean;
}

/**
 * A generic, type-safe factory function to create a PaginatedResponseDto class.
 * This is the correct way to handle generic DTOs with `@nestjs/swagger`.
 * It ensures that the `data` property is correctly documented in the API.
 */
export function createPaginatedResponseDto<T extends NestType>(dataType: T) {
  class PaginatedResponse {
    @ApiProperty({ isArray: true, type: dataType })
    data: InstanceType<T>[];

    @ApiProperty({ type: () => PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(data: InstanceType<T>[], total: number, query: PaginationQueryDto) {
      this.data = data;

      // --- Safe defaults for strict null checks ---
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      // --------------------------------------------

      const totalPages = Math.ceil(total / limit);
      this.meta = {
        total,
        limit,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    }
  }

  // Dynamically set the class name for clear Swagger documentation
  Object.defineProperty(PaginatedResponse, 'name', {
    value: `Paginated${dataType.name}Response`,
  });

  return PaginatedResponse;
}
