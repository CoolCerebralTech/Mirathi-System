// src/succession-automation/src/application/roadmap/queries/view-models/paginated-list.vm.ts

export class PaginatedListVm<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.meta = {
      totalItems: total,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
}
