"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQueryDto = exports.SortOrder = void 0;
exports.createPaginatedResponseDto = createPaginatedResponseDto;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
// --- Reusable Enum for Sorting ---
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
/**
 * Defines the standardized query parameters for pagination and sorting.
 * To be used in controller methods for GET requests on lists.
 */
class PaginationQueryDto {
    page = 1;
    limit = 10;
    search;
    sortBy;
    sortOrder = SortOrder.DESC;
}
exports.PaginationQueryDto = PaginationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The page number to retrieve.',
        default: 1,
        minimum: 1,
        type: Number,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The number of items to return per page.',
        default: 10,
        minimum: 1,
        maximum: 100,
        type: Number,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], PaginationQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'A search term to filter results.',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The field to sort the results by.',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The direction to sort the results.',
        enum: SortOrder,
        default: SortOrder.DESC,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortOrder", void 0);
/**
 * Defines the metadata for a paginated response.
 */
class PaginationMetaDto {
    page;
    limit;
    total;
    totalPages;
    hasNext;
    hasPrev;
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number.', example: 1 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items per page.', example: 10 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of items available.', example: 100 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of pages available.', example: 10 }),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates if there is a next page.', example: true }),
    __metadata("design:type", Boolean)
], PaginationMetaDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates if there is a previous page.', example: false }),
    __metadata("design:type", Boolean)
], PaginationMetaDto.prototype, "hasPrev", void 0);
/**
 * A generic, type-safe factory function to create a PaginatedResponseDto class.
 * This is the correct way to handle generic DTOs with `@nestjs/swagger`.
 * It ensures that the `data` property is correctly documented in the API.
 */
function createPaginatedResponseDto(dataType) {
    class PaginatedResponse {
        data;
        meta;
        constructor(data, total, query) {
            this.data = data;
            // --- THE FIX IS HERE ---
            // We safely handle potentially undefined page/limit values by providing
            // fallback defaults. This satisfies TypeScript's strict null checks.
            const page = query.page ?? 1;
            const limit = query.limit ?? 10;
            // -----------------------
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
    __decorate([
        (0, swagger_1.ApiProperty)({ isArray: true, type: dataType }),
        __metadata("design:type", Array)
    ], PaginatedResponse.prototype, "data", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ type: () => PaginationMetaDto }),
        __metadata("design:type", PaginationMetaDto)
    ], PaginatedResponse.prototype, "meta", void 0);
    // Dynamically set the class name for clear Swagger documentation
    Object.defineProperty(PaginatedResponse, 'name', {
        value: `Paginated${dataType.name}Response`,
    });
    return PaginatedResponse;
}
//# sourceMappingURL=pagination.dto.js.map