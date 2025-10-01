import { Type as NestType } from '@nestjs/common';
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
/**
 * Defines the standardized query parameters for pagination and sorting.
 * To be used in controller methods for GET requests on lists.
 */
export declare class PaginationQueryDto {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
}
/**
 * Defines the metadata for a paginated response.
 */
declare class PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
/**
 * A generic, type-safe factory function to create a PaginatedResponseDto class.
 * This is the correct way to handle generic DTOs with `@nestjs/swagger`.
 * It ensures that the `data` property is correctly documented in the API.
 */
export declare function createPaginatedResponseDto<T extends NestType>(dataType: T): {
    new (data: any[], total: number, query: PaginationQueryDto): {
        data: T[];
        meta: PaginationMetaDto;
    };
};
export {};
//# sourceMappingURL=pagination.dto.d.ts.map