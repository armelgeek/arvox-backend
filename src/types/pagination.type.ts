/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  startIndex: number
  endIndex: number
  showing: string
}

/**
 * Pagination links interface
 */
export interface PaginationLinks {
  first: string
  last: string
  prev?: string
  next?: string
  self: string
}

/**
 * Complete pagination response interface
 */
export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMeta & {
    links?: PaginationLinks
  }
}
