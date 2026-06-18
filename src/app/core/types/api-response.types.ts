/** Mirrors the backend global response contracts. */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

/** Standard wrapper for every API response. */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/** Unwrapped result of a paginated endpoint. */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
