/**
 * Utility class for handling pagination logic
 */
export class PaginationUtil {
  private readonly defaultPage: number = 1;
  private readonly defaultLimit: number = 10;
  private readonly maxLimit: number = 100;

  /**
   * Extract pagination parameters from Hono context
   * @param c - Hono context
   * @returns Pagination parameters with skip calculated
   */
  extractFromContext(c: any): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, parseInt(c.req.query('limit') || String(this.defaultLimit), 10))
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Calculate pagination metadata
   * @param total - Total number of items
   * @param page - Current page
   * @param limit - Items per page
   * @returns Pagination metadata
   */
  calculateMetadata(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      startIndex,
      endIndex,
      showing: `${startIndex}-${endIndex} of ${total}`
    };
  }

  /**
   * Validate pagination parameters
   * @param page - Page number
   * @param limit - Items per page
   * @throws Error if parameters are invalid
   */
  validate(page: number, limit: number): void {
    if (page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (limit < 1) {
      throw new Error('Limit must be greater than 0');
    }

    if (limit > this.maxLimit) {
      throw new Error(`Limit cannot exceed ${this.maxLimit}`);
    }
  }

  /**
   * Create pagination links for navigation
   * @param baseUrl - Base URL for the resource
   * @param page - Current page
   * @param totalPages - Total number of pages
   * @param limit - Items per page
   * @returns Navigation links
   */
  createLinks(baseUrl: string, page: number, totalPages: number, limit: number) {
    const links: { [key: string]: string | null } = {
      first: `${baseUrl}?page=1&limit=${limit}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      self: `${baseUrl}?page=${page}&limit=${limit}`
    };

    // Remove null values
    return Object.fromEntries(
      Object.entries(links).filter(([_, value]) => value !== null)
    );
  }

  /**
   * Apply pagination to an array (for in-memory pagination)
   * @param items - Array of items
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated subset of items
   */
  applyToArray<T>(items: T[], page: number, limit: number): T[] {
    const skip = (page - 1) * limit;
    return items.slice(skip, skip + limit);
  }

  /**
   * Create a paginated response structure
   * @param items - Array of items
   * @param total - Total count
   * @param page - Current page
   * @param limit - Items per page
   * @param baseUrl - Optional base URL for links
   * @returns Complete paginated response
   */
  createResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    baseUrl?: string
  ) {
    const metadata = this.calculateMetadata(total, page, limit);
    const links = baseUrl ? this.createLinks(baseUrl, page, metadata.totalPages, limit) : undefined;

    return {
      items,
      pagination: {
        ...metadata,
        ...(links && { links })
      }
    };
  }

  /**
   * Get default pagination values
   * @returns Default page and limit values
   */
  getDefaults(): { page: number; limit: number } {
    return {
      page: this.defaultPage,
      limit: this.defaultLimit
    };
  }

  /**
   * Get maximum allowed limit
   * @returns Maximum limit value
   */
  getMaxLimit(): number {
    return this.maxLimit;
  }
}
