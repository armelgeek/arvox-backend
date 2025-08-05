import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

/**
 * Helper pour créer des routes OpenAPI avec documentation standardisée
 */
export class DocumentationHelper {
  /**
   * Créer une route GET avec pagination
   */
  static createListRoute<TResponse>(config: {
    path: string
    tag: string
    summary: string
    description?: string
    responseSchema: z.ZodSchema<TResponse>
    queryParams?: z.ZodSchema<any>
    security?: boolean
  }) {
    return createRoute({
      method: 'get',
      path: config.path,
      tags: [config.tag],
      summary: config.summary,
      description: config.description,
      security: config.security ? [{ bearerAuth: [] }] : undefined,
      request: {
        query: z.object({
          page: z.string().optional().transform(val => val ? parseInt(val) : 1),
          limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
          search: z.string().optional(),
          sort: z.string().optional()
        })
      },
      responses: {
        200: {
          description: 'Liste récupérée avec succès',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  items: z.array(config.responseSchema),
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
        400: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        },
        401: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        }
      }
    });
  }

  /**
   * Créer une route GET par ID
   */
  static createGetByIdRoute<TResponse>(config: {
    path: string
    tag: string
    summary: string
    description?: string
    responseSchema: z.ZodSchema<TResponse>
    security?: boolean
  }) {
    return createRoute({
      method: 'get',
      path: config.path,
      tags: [config.tag],
      summary: config.summary,
      description: config.description,
      security: config.security ? [{ bearerAuth: [] }] : undefined,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: 'Ressource récupérée avec succès',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: config.responseSchema
              })
            }
          }
        },
        404: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        },
        401: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        }
      }
    });
  }

  /**
   * Créer une route POST
   */
  static createPostRoute<TRequest, TResponse>(config: {
    path: string
    tag: string
    summary: string
    description?: string
    requestSchema: z.ZodSchema<TRequest>
    responseSchema: z.ZodSchema<TResponse>
    security?: boolean
    multipart?: boolean
  }) {
    const contentType = config.multipart ? 'multipart/form-data' : 'application/json';
    
    return createRoute({
      method: 'post',
      path: config.path,
      tags: [config.tag],
      summary: config.summary,
      description: config.description,
      security: config.security ? [{ bearerAuth: [] }] : undefined,
      request: {
        body: {
          content: {
            [contentType]: {
              schema: config.requestSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Ressource créée avec succès',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: config.responseSchema
              })
            }
          }
        },
        400: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string(),
                details: z.array(z.object({
                  field: z.string(),
                  message: z.string()
                })).optional()
              })
            }
          }
        },
        401: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        }
      }
    });
  }

  /**
   * Créer une route PUT
   */
  static createPutRoute<TRequest, TResponse>(config: {
    path: string
    tag: string
    summary: string
    description?: string
    requestSchema: z.ZodSchema<TRequest>
    responseSchema: z.ZodSchema<TResponse>
    security?: boolean
    multipart?: boolean
  }) {
    const contentType = config.multipart ? 'multipart/form-data' : 'application/json';
    
    return createRoute({
      method: 'put',
      path: config.path,
      tags: [config.tag],
      summary: config.summary,
      description: config.description,
      security: config.security ? [{ bearerAuth: [] }] : undefined,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        }),
        body: {
          content: {
            [contentType]: {
              schema: config.requestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Ressource mise à jour avec succès',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: config.responseSchema
              })
            }
          }
        },
        400: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        },
        404: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        },
        401: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        }
      }
    });
  }

  /**
   * Créer une route DELETE
   */
  static createDeleteRoute(config: {
    path: string
    tag: string
    summary: string
    description?: string
    security?: boolean
  }) {
    return createRoute({
      method: 'delete',
      path: config.path,
      tags: [config.tag],
      summary: config.summary,
      description: config.description,
      security: config.security ? [{ bearerAuth: [] }] : undefined,
      request: {
        params: z.object({
          id: z.string().uuid('ID must be a valid UUID')
        })
      },
      responses: {
        200: {
          description: 'Ressource supprimée avec succès',
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
        404: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        },
        401: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                error: z.string()
              })
            }
          }
        }
      }
    });
  }

  /**
   * Créer un schéma de base pour une entité
   */
  static createBaseEntitySchema() {
    return z.object({
      id: z.string().uuid().describe('Identifiant unique'),
      createdAt: z.date().describe('Date de création'),
      updatedAt: z.date().describe('Date de dernière modification')
    });
  }

  /**
   * Créer un schéma de création (sans id, createdAt, updatedAt)
   */
  static createCreateSchema<T extends z.ZodRawShape>(entitySchema: z.ZodObject<T>): any {
    return (entitySchema as any).omit({ id: true, createdAt: true, updatedAt: true });
  }

  /**
   * Créer un schéma de mise à jour (partial sans id, createdAt, updatedAt)
   */
  static omitTimestamps<T extends z.ZodTypeAny>(entitySchema: T): any {
    // TypeScript ne peut pas inferrer exactement le type omit, donc nous utilisons any
    return (entitySchema as any).omit({ id: true, createdAt: true, updatedAt: true });
  }

  static omitTimestampsAndMakePartial<T extends z.ZodTypeAny>(entitySchema: T): any {
    // TypeScript ne peut pas inferrer exactement le type omit + partial, donc nous utilisons any
    return (entitySchema as any).omit({ id: true, createdAt: true, updatedAt: true }).partial();
  }

  /**
   * Ajouter des exemples à un schéma
   */
  static addExamples<T>(schema: z.ZodSchema<T>, examples: Record<string, any>) {
    return schema.describe(JSON.stringify({ examples }));
  }

  /**
   * Créer un header d'autorisation
   */
  static createAuthHeader() {
    return z.object({
      authorization: z.string().describe('Bearer token for authentication').optional()
    });
  }
}
