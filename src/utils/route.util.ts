import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

/**
 * Utilitaires pour simplifier la création de routes OpenAPI
 * Alternative plus simple et pratique aux décorateurs
 */

// Types de base pour les schémas
export interface RouteSchemas<TRequest = any, TResponse = any> {
  request?: z.ZodSchema<TRequest>
  response: z.ZodSchema<TResponse>
  query?: z.ZodSchema<any>
}

export interface RouteOptions {
  tag?: string
  summary?: string
  description?: string
  security?: boolean
  statusCode?: number
}

/**
 * Classe utilitaire pour créer des routes simplifiées
 */
export class RouteBuilder {
  
  /**
   * Créer une route POST simplifiée
   */
  static post<TRequest, TResponse>(
    path: string,
    schemas: RouteSchemas<TRequest, TResponse> & { request: z.ZodSchema<TRequest> },
    options: RouteOptions = {}
  ) {
    return createRoute({
      method: 'post',
      path,
      tags: [options.tag || 'API'],
      summary: options.summary || 'Create resource',
      description: options.description,
      request: {
        body: {
          content: {
            'application/json': {
              schema: schemas.request
            }
          }
        }
      },
      responses: {
        [options.statusCode || 201]: {
          description: 'Resource created successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schemas.response
              })
            }
          }
        },
        400: this.errorResponse('Validation error'),
        ...(options.security ? { 401: this.errorResponse('Unauthorized') } : {})
      }
    });
  }

  /**
   * Créer une route GET simplifiée avec pagination
   */
  static getList<TResponse>(
    path: string,
    schemas: RouteSchemas<any, TResponse>,
    options: RouteOptions = {}
  ) {
    return createRoute({
      method: 'get',
      path,
      tags: [options.tag || 'API'],
      summary: options.summary || 'Get resource list',
      description: options.description,
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
          description: 'Resources retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  items: z.array(schemas.response),
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
        400: this.errorResponse('Bad request'),
        ...(options.security ? { 401: this.errorResponse('Unauthorized') } : {})
      }
    });
  }

  /**
   * Créer une route GET par ID simplifiée
   */
  static getById<TResponse>(
    path: string,
    schemas: RouteSchemas<any, TResponse>,
    options: RouteOptions = {}
  ) {
    return createRoute({
      method: 'get',
      path,
      tags: [options.tag || 'API'],
      summary: options.summary || 'Get resource by ID',
      description: options.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: 'Resource retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schemas.response
              })
            }
          }
        },
        404: this.errorResponse('Resource not found'),
        ...(options.security ? { 401: this.errorResponse('Unauthorized') } : {})
      }
    });
  }

  /**
   * Créer une route PUT simplifiée
   */
  static put<TRequest, TResponse>(
    path: string,
    schemas: RouteSchemas<TRequest, TResponse> & { request: z.ZodSchema<TRequest> },
    options: RouteOptions = {}
  ) {
    return createRoute({
      method: 'put',
      path,
      tags: [options.tag || 'API'],
      summary: options.summary || 'Update resource',
      description: options.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        }),
        body: {
          content: {
            'application/json': {
              schema: schemas.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Resource updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: schemas.response
              })
            }
          }
        },
        400: this.errorResponse('Validation error'),
        404: this.errorResponse('Resource not found'),
        ...(options.security ? { 401: this.errorResponse('Unauthorized') } : {})
      }
    });
  }

  /**
   * Créer une route DELETE simplifiée
   */
  static delete(
    path: string,
    options: RouteOptions = {}
  ) {
    return createRoute({
      method: 'delete',
      path,
      tags: [options.tag || 'API'],
      summary: options.summary || 'Delete resource',
      description: options.description,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: 'Resource deleted successfully',
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
        404: this.errorResponse('Resource not found'),
        ...(options.security ? { 401: this.errorResponse('Unauthorized') } : {})
      }
    });
  }

  /**
   * Helper pour créer une réponse d'erreur standardisée
   */
  private static errorResponse(description: string) {
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

/**
 * Export des méthodes statiques pour une utilisation plus concise
 */
export const Route = {
  post: RouteBuilder.post,
  getList: RouteBuilder.getList,
  getById: RouteBuilder.getById,
  put: RouteBuilder.put,
  delete: RouteBuilder.delete
};

// Utilitaires pour les schémas courants
export const CommonSchemas = {
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  isActive: z.boolean(),
  timestamps: z.object({
    createdAt: z.date(),
    updatedAt: z.date()
  })
};

/**
 * Helper pour créer des schémas de création (sans id, timestamps)
 */
export function createSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}

/**
 * Helper pour créer des schémas de mise à jour (partiels)
 */
export function updateSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).partial();
}

/**
 * Helper pour créer des schémas d'entité complète
 */
export function entitySchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    id: CommonSchemas.id,
    ...shape,
    ...CommonSchemas.timestamps.shape
  });
}
