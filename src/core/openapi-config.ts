
/**
 * Configuration avancée pour OpenAPI/Swagger
 */
export interface OpenAPIConfig {
  title?: string
  description?: string
  version?: string
  contact?: {
    name?: string
    email?: string
    url?: string
  }
  license?: {
    name: string
    url?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }>
  security?: Array<{
    [key: string]: string[]
  }>
  components?: {
    securitySchemes?: {
      [key: string]: {
        type: string
        scheme?: string
        bearerFormat?: string
        description?: string
        in?: string
        name?: string
      }
    }
  }
}

/**
 * Configuration par défaut pour OpenAPI
 */
export const defaultOpenAPIConfig: OpenAPIConfig = {
  title: 'Arvox Backend API',
  description: `
# API Documentation

Cette API a été construite avec le framework **@arvox/backend-framework**, 
utilisant une architecture hexagonale (Clean Architecture) pour une séparation 
claire des responsabilités.

## Architecture

- **Domain Layer**: Entités métier et interfaces
- **Application Layer**: Cas d'usage et services
- **Infrastructure Layer**: Controllers, repositories et APIs externes

## Authentification

L'API utilise l'authentification Bearer Token. Incluez votre token dans l'en-tête:
\`\`\`
Authorization: Bearer <votre-token>
\`\`\`

## Codes de réponse

- **200**: Succès
- **201**: Créé avec succès  
- **400**: Erreur de validation
- **401**: Non authentifié
- **403**: Accès refusé
- **404**: Ressource non trouvée
- **500**: Erreur serveur

## Format des réponses

Toutes les réponses suivent ce format standard:

### Succès
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Erreur
\`\`\`json
{
  "success": false,
  "error": "Message d'erreur"
}
\`\`\`

### Pagination
\`\`\`json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
\`\`\`
  `,
  version: '1.0.0',
  contact: {
    name: 'API Support',
    email: 'support@arvox.com',
    url: 'https://arvox.com/support'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  },
  tags: [
    {
      name: 'Health',
      description: 'Endpoints de santé et monitoring'
    },
    {
      name: 'Authentication',
      description: 'Gestion de l\'authentification et des tokens'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT pour l\'authentification'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Clé API pour l\'authentification'
      }
    }
  }
}

/**
 * Schémas de réponse communs pour OpenAPI
 */
export const commonSchemas = {
  // Réponse de succès générique
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        description: 'Données de la réponse'
      }
    },
    required: ['success', 'data']
  },

  // Réponse d'erreur générique
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        description: 'Message d\'erreur',
        example: 'Une erreur est survenue'
      }
    },
    required: ['success', 'error']
  },

  // Réponse de validation d'erreur
  ValidationErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        example: 'Validation failed'
      },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'email'
            },
            message: {
              type: 'string',
              example: 'Invalid email format'
            }
          }
        }
      }
    },
    required: ['success', 'error']
  },

  // Métadonnées de pagination
  PaginationMeta: {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        description: 'Nombre total d\'éléments',
        example: 100
      },
      page: {
        type: 'integer',
        description: 'Page actuelle',
        example: 1
      },
      limit: {
        type: 'integer',
        description: 'Nombre d\'éléments par page',
        example: 10
      },
      totalPages: {
        type: 'integer',
        description: 'Nombre total de pages',
        example: 10
      },
      hasNext: {
        type: 'boolean',
        description: 'Y a-t-il une page suivante',
        example: true
      },
      hasPrev: {
        type: 'boolean',
        description: 'Y a-t-il une page précédente',
        example: false
      }
    },
    required: ['total', 'page', 'limit', 'totalPages', 'hasNext', 'hasPrev']
  },

  // Réponse paginée générique
  PaginatedResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Liste des éléments'
          },
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
          }
        }
      }
    },
    required: ['success', 'data']
  },

  // Modèle d'entité de base
  BaseEntity: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Identifiant unique',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date de création',
        example: '2023-08-05T12:00:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date de dernière modification',
        example: '2023-08-05T12:00:00.000Z'
      }
    },
    required: ['id', 'createdAt', 'updatedAt']
  }
}

/**
 * Paramètres de requête communs
 */
export const commonParameters = {
  // Paramètres de pagination
  pageParam: {
    name: 'page',
    in: 'query',
    description: 'Numéro de page (commence à 1)',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1,
      example: 1
    }
  },

  limitParam: {
    name: 'limit',
    in: 'query',
    description: 'Nombre d\'éléments par page (max 100)',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
      example: 10
    }
  },

  // Paramètre de recherche
  searchParam: {
    name: 'search',
    in: 'query',
    description: 'Terme de recherche',
    required: false,
    schema: {
      type: 'string',
      minLength: 1,
      example: 'terme de recherche'
    }
  },

  // Paramètre de tri
  sortParam: {
    name: 'sort',
    in: 'query',
    description: 'Champ de tri (préfixe avec - pour tri décroissant)',
    required: false,
    schema: {
      type: 'string',
      example: '-createdAt'
    }
  },

  // Paramètre d'ID
  idParam: {
    name: 'id',
    in: 'path',
    description: 'Identifiant unique de la ressource',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }
  }
}
