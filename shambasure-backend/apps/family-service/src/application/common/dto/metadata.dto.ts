export class MetadataDto {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;

  constructor(totalItems: number, page: number, limit: number) {
    this.totalItems = totalItems;
    this.itemsPerPage = limit;
    this.currentPage = page;
    this.totalPages = Math.ceil(totalItems / limit);
    // Calculated field: how many items are in the current batch
    this.itemCount = 0; // This should be set by the service/controller based on actual result length
  }
}

export class PaginatedResult<T> {
  data: T[];
  meta: MetadataDto;

  constructor(data: T[], meta: MetadataDto) {
    this.data = data;
    this.meta = meta;
    this.meta.itemCount = data.length;
  }
}
