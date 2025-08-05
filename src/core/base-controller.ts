import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { IController } from '../interfaces/controller.interface';
import { ResponseUtil } from '../utils/response.util';
import { PaginationUtil } from '../utils/pagination.util';

/**
 * Base controller class providing common HTTP functionality
 * All controllers should extend this class for consistent behavior
 */
export abstract class BaseController implements IController {
  public controller: OpenAPIHono;
  protected responseUtil: ResponseUtil;
  protected paginationUtil: PaginationUtil;

  constructor() {
    this.controller = new OpenAPIHono();
    this.responseUtil = new ResponseUtil();
    this.paginationUtil = new PaginationUtil();
    this.initRoutes();
  }

  /**
   * Initialize all routes for this controller
   * Must be implemented by child classes
   */
  abstract initRoutes(): void

  /**
   * Handle standard success response
   * @param data - Data to return
   * @param status - HTTP status code (default: 200)
   * @returns Formatted success response
   */
  protected success<T>(data: T, status: number = 200) {
    return this.responseUtil.success(data, status);
  }

  /**
   * Handle standard error response
   * @param error - Error message or Error object
   * @param status - HTTP status code (default: 400)
   * @returns Formatted error response
   */
  protected error(error: string | Error, status: number = 400) {
    return this.responseUtil.error(error, status);
  }

  /**
   * Handle paginated response
   * @param items - Array of items
   * @param total - Total count of items
   * @param page - Current page number
   * @param limit - Items per page
   * @param status - HTTP status code (default: 200)
   * @returns Formatted paginated response
   */
  protected paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    status: number = 200
  ) {
    return this.responseUtil.paginated(items, total, page, limit, status);
  }

  /**
   * Extract pagination parameters from request context
   * @param c - Hono context
   * @returns Pagination parameters with defaults
   */
  protected getPaginationParams(c: any): { page: number; limit: number; skip: number } {
    return this.paginationUtil.extractFromContext(c);
  }

  /**
   * Handle file upload validation
   * @param file - Uploaded file
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSize - Maximum file size in bytes
   * @throws Error if validation fails
   */
  protected validateFile(file: File, allowedTypes: string[], maxSize: number): void {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not allowed. Accepted types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
    }
  }

  /**
   * Handle multipart form data extraction
   * @param c - Hono context
   * @returns Promise with form data object
   */
  protected async extractFormData(c: any): Promise<{ [key: string]: any }> {
    const body = await c.req.parseBody();
    const formData: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(body)) {
      if (value instanceof File) {
        formData[key] = value;
      } else if (typeof value === 'string') {
        // Try to parse JSON strings
        try {
          formData[key] = JSON.parse(value);
        } catch {
          formData[key] = value;
        }
      } else {
        formData[key] = value;
      }
    }

    return formData;
  }

  /**
   * Extract user information from authenticated context
   * @param c - Hono context
   * @returns User information or null if not authenticated
   */
  protected getAuthenticatedUser(c: any): any | null {
    return c.get('user') || null;
  }

  /**
   * Check if user has required role
   * @param c - Hono context
   * @param requiredRoles - Array of required roles
   * @returns Boolean indicating if user has required role
   */
  protected hasRole(c: any, requiredRoles: string[]): boolean {
    const user = this.getAuthenticatedUser(c);
    if (!user || !user.role) return false;

    return requiredRoles.includes(user.role.name);
  }

  /**
   * Create a simplified POST route with automatic OpenAPI configuration
   * @param path - Route path
   * @param schema - Request and response schemas
   * @param handler - Route handler function
   * @param options - Additional options
   */
  protected createPostRoute<TRequest, TResponse>(
    path: string,
    schema: {
      request: z.ZodSchema<TRequest>
      response: z.ZodSchema<TResponse>
      tag?: string
      summary?: string
      description?: string
    },
    handler: (c: any, body: TRequest) => Promise<any>,
    options?: {
      security?: boolean
      multipart?: boolean
      statusCode?: number
    }
  ) {
    const route = createRoute({
      method: 'post',
      path,
      tags: [schema.tag || this.getDefaultTag()],
      summary: schema.summary || `Create ${this.getResourceName()}`,
      description: schema.description,
      request: {
        body: {
          content: {
            [options?.multipart ? 'multipart/form-data' : 'application/json']: {
              schema: schema.request
            }
          }
        }
      },
      responses: {
        [options?.statusCode || 201]: {
          description: `${this.getResourceName()} created successfully`,
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schema.response
              })
            }
          }
        },
        400: this.getErrorResponse('Validation error'),
        ...(options?.security ? { 401: this.getErrorResponse('Unauthorized') } : {})
      }
    });

    this.controller.openapi(route, async (c:any) => {
      const body = c.req.valid('json');
      return await handler(c, body);
    });
  }

  /**
   * Create a simplified GET route for listing resources with pagination
   * @param path - Route path
   * @param schema - Response schema
   * @param handler - Route handler function
   * @param options - Additional options
   */
  protected createListRoute<TResponse>(
    path: string,
    schema: {
      response: z.ZodSchema<TResponse>
      tag?: string
      summary?: string
      description?: string
    },
    handler: (c: any, query: { page: number; limit: number; search?: string; sort?: string }) => Promise<any>,
    options?: {
      security?: boolean
    }
  ) {
    const route = createRoute({
      method: 'get',
      path,
      tags: [schema.tag || this.getDefaultTag()],
      summary: schema.summary || `Get ${this.getResourceName()} list`,
      description: schema.description,
      request: {
        query: z.object({
          page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
          limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
          search: z.string().optional(),
          sort: z.string().optional()
        })
      },
      responses: {
        200: {
          description: `${this.getResourceName()} list retrieved successfully`,
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  items: z.array(schema.response),
                  pagination: z.object({
                    total: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    totalPages: z.number(),
                    hasNext: z.boolean(),
                    hasPrev: z.boolean()
                  })
                })
              })
            }
          }
        },
        400: this.getErrorResponse('Bad request'),
        ...(options?.security ? { 401: this.getErrorResponse('Unauthorized') } : {})
      }
    });

    this.controller.openapi(route, async (c) => {
      const query = c.req.valid('query');
      return await handler(c, query);
    });
  }

  /**
   * Create a simplified GET route for single resource
   * @param path - Route path (should include {id} parameter)
   * @param schema - Response schema
   * @param handler - Route handler function
   * @param options - Additional options
   */
  protected createGetByIdRoute<TResponse>(
    path: string,
    schema: {
      response: z.ZodSchema<TResponse>
      tag?: string
      summary?: string
      description?: string
    },
    handler: (c: any, id: string) => Promise<any>,
    options?: {
      security?: boolean
    }
  ) {
    const route = createRoute({
      method: 'get',
      path,
      tags: [schema.tag || this.getDefaultTag()],
      summary: schema.summary || `Get ${this.getResourceName()} by ID`,
      description: schema.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: `${this.getResourceName()} retrieved successfully`,
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schema.response
              })
            }
          }
        },
        404: this.getErrorResponse('Resource not found'),
        ...(options?.security ? { 401: this.getErrorResponse('Unauthorized') } : {})
      }
    });

    this.controller.openapi(route, async (c) => {
      const { id } = c.req.valid('param');
      return await handler(c, id);
    });
  }

  /**
   * Create a simplified PUT route
   * @param path - Route path (should include {id} parameter)
   * @param schema - Request and response schemas
   * @param handler - Route handler function
   * @param options - Additional options
   */
  protected createPutRoute<TRequest, TResponse>(
    path: string,
    schema: {
      request: z.ZodSchema<TRequest>
      response: z.ZodSchema<TResponse>
      tag?: string
      summary?: string
      description?: string
    },
    handler: (c: any, id: string, body: TRequest) => Promise<any>,
    options?: {
      security?: boolean
      multipart?: boolean
    }
  ) {
    const route = createRoute({
      method: 'put',
      path,
      tags: [schema.tag || this.getDefaultTag()],
      summary: schema.summary || `Update ${this.getResourceName()}`,
      description: schema.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        }),
        body: {
          content: {
            [options?.multipart ? 'multipart/form-data' : 'application/json']: {
              schema: schema.request
            }
          }
        }
      },
      responses: {
        200: {
          description: `${this.getResourceName()} updated successfully`,
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schema.response
              })
            }
          }
        },
        400: this.getErrorResponse('Validation error'),
        404: this.getErrorResponse('Resource not found'),
        ...(options?.security ? { 401: this.getErrorResponse('Unauthorized') } : {})
      }
    });

    this.controller.openapi(route, async (c:any) => {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      return await handler(c, id, body);
    });
  }

  /**
   * Create a simplified DELETE route
   * @param path - Route path (should include {id} parameter)
   * @param schema - Optional configuration
   * @param handler - Route handler function
   * @param options - Additional options
   */
  protected createDeleteRoute(
    path: string,
    schema: {
      tag?: string
      summary?: string
      description?: string
    },
    handler: (c: any, id: string) => Promise<any>,
    options?: {
      security?: boolean
    }
  ) {
    const route = createRoute({
      method: 'delete',
      path,
      tags: [schema.tag || this.getDefaultTag()],
      summary: schema.summary || `Delete ${this.getResourceName()}`,
      description: schema.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: `${this.getResourceName()} deleted successfully`,
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  deleted: z.boolean()
                })
              })
            }
          }
        },
        404: this.getErrorResponse('Resource not found'),
        ...(options?.security ? { 401: this.getErrorResponse('Unauthorized') } : {})
      }
    });

    this.controller.openapi(route, async (c) => {
      const { id } = c.req.valid('param');
      return await handler(c, id);
    });
  }

  /**
   * Get default tag for routes (can be overridden in child classes)
   */
  protected getDefaultTag(): string {
    return this.constructor.name.replace('Controller', '');
  }

  /**
   * Get resource name for documentation (can be overridden in child classes)
   */
  protected getResourceName(): string {
    return this.getDefaultTag().toLowerCase();
  }

  /**
   * Get standardized error response schema
   */
  private getErrorResponse(description: string) {
    return {
      description,
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string()
          })
        }
      }
    };
  }
}
