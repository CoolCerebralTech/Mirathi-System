import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  /**
   * Optional: Allow clients to request a specific offset directly.
   * Usually, you only need page/limit, but keeping this for flexibility.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  /**
   * database 'skip' calculator.
   * Handles the logic: If offset is provided, use it; otherwise calculate from page.
   */
  get skip(): number {
    if (this.offset !== undefined) {
      return this.offset;
    }
    // Safe calculation ensuring we don't return negative numbers
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
