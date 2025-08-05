/**
 * Utility class for standardizing API responses
 */
export class ResponseUtil {
  /**
   * Create a successful response
   * @param data - Data to return
   * @param status - HTTP status code
   * @returns Response object with JSON and status
   */
  success<T>(data: T, status: number = 200) {
    return {
      json: {
        success: true,
        data
      },
      status
    }
  }

  /**
   * Create an error response
   * @param error - Error message or Error object
   * @param status - HTTP status code
   * @returns Response object with JSON and status
   */
  error(error: string | Error, status: number = 400) {
    const message = error instanceof Error ? error.message : error
    return {
      json: {
        success: false,
        error: message
      },
      status
    }
  }

  /**
   * Create a paginated response
   * @param items - Array of items
   * @param total - Total count
   * @param page - Current page
   * @param limit - Items per page
   * @param status - HTTP status code
   * @returns Paginated response object
   */
  paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    status: number = 200
  ) {
    const totalPages = Math.ceil(total / limit)
    
    return {
      json: {
        success: true,
        data: {
          items,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      },
      status
    }
  }

  /**
   * Create a validation error response
   * @param errors - Validation errors
   * @param status - HTTP status code
   * @returns Validation error response
   */
  validationError(errors: Array<{ field: string; message: string }>, status: number = 422) {
    return {
      json: {
        success: false,
        error: 'Validation failed',
        details: errors
      },
      status
    }
  }

  /**
   * Create a not found response
   * @param resource - Resource that was not found
   * @returns Not found response
   */
  notFound(resource: string = 'Resource') {
    return {
      json: {
        success: false,
        error: `${resource} not found`
      },
      status: 404
    }
  }

  /**
   * Create an unauthorized response
   * @param message - Optional custom message
   * @returns Unauthorized response
   */
  unauthorized(message: string = 'Unauthorized') {
    return {
      json: {
        success: false,
        error: message
      },
      status: 401
    }
  }

  /**
   * Create a forbidden response
   * @param message - Optional custom message
   * @returns Forbidden response
   */
  forbidden(message: string = 'Forbidden') {
    return {
      json: {
        success: false,
        error: message
      },
      status: 403
    }
  }

  /**
   * Create a conflict response
   * @param message - Conflict message
   * @returns Conflict response
   */
  conflict(message: string) {
    return {
      json: {
        success: false,
        error: message
      },
      status: 409
    }
  }

  /**
   * Create a server error response
   * @param message - Error message
   * @returns Server error response
   */
  serverError(message: string = 'Internal server error') {
    return {
      json: {
        success: false,
        error: message
      },
      status: 500
    }
  }
}
