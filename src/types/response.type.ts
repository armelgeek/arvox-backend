export interface StandardResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
}
