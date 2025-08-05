import { BaseController } from '../src/core/base-controller'
import { Route, createSchema, updateSchema, entitySchema, CommonSchemas } from '../src/utils/route.util'
import { z } from 'zod'

/**
 * Exemple final montrant les 3 approches pour simplifier createRoute
 */

// 📊 Définition des schémas
const UserSchema = entitySchema({
  name: CommonSchemas.name,
  email: CommonSchemas.email,
  role: z.enum(['admin', 'user', 'moderator'])
})

const CreateUserSchema = createSchema({
  name: CommonSchemas.name,
  email: CommonSchemas.email,
  role: z.enum(['admin', 'user', 'moderator']).default('user')
})

const UpdateUserSchema = updateSchema({
  name: CommonSchemas.name,
  email: CommonSchemas.email,
  role: z.enum(['admin', 'user', 'moderator'])
})

type User = z.infer<typeof UserSchema>

/**
 * ❌ APPROCHE ORIGINALE - Très verbeuse
 */
export class OriginalUserController extends BaseController {
  initRoutes() {
    // Code original de 40+ lignes pour une simple route POST
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/users',
        tags: ['Users'],
        summary: 'Create user',
        request: {
          body: {
            content: {
              'application/json': {
                schema: CreateUserSchema
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: UserSchema
                })
              }
            }
          },
          400: {
            description: 'Validation error',
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
      }),
      async (c) => {
        const body = c.req.valid('json')
        // Logique...
        return c.json({ success: true, data: {} }, 201)
      }
    )
  }
}

/**
 * ✅ APPROCHE 1 - Méthodes BaseController (Réduction 60%)
 */
export class SimplifiedUserController extends BaseController {
  initRoutes() {
    // POST /users - Plus simple avec createPostRoute
    this.createPostRoute(
      '/users',
      {
        request: CreateUserSchema,
        response: UserSchema,
        summary: 'Create user',
        tag: 'Users'
      },
      async (c, body) => {
        const newUser: User = {
          id: crypto.randomUUID(),
          ...body,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return c.json({ success: true, data: newUser }, 201)
      },
      { security: true }
    )

    // GET /users - Liste avec pagination
    this.createListRoute(
      '/users',
      {
        response: UserSchema,
        summary: 'Get users',
        tag: 'Users'
      },
      async (c, query) => {
        const users: User[] = []
        const total = 0
        
        return c.json({
          success: true,
          data: {
            items: users,
            pagination: {
              total,
              page: query.page,
              limit: query.limit,
              totalPages: Math.ceil(total / query.limit),
              hasNext: query.page < Math.ceil(total / query.limit),
              hasPrev: query.page > 1
            }
          }
        })
      }
    )
  }
}

/**
 * ✅ APPROCHE 2 - Route Utility (Réduction 70%)
 */
export class UtilityUserController extends BaseController {
  initRoutes() {
    // POST /users - Ultra-concis avec Route.post
    this.controller.openapi(
      Route.post('/users', {
        request: CreateUserSchema,
        response: UserSchema
      }, {
        tag: 'Users',
        summary: 'Create user',
        security: true
      }),
      async (c) => {
        const body = c.req.valid('json')
        const newUser: User = {
          id: crypto.randomUUID(),
          ...body,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return c.json({ success: true, data: newUser }, 201)
      }
    )

    // GET /users - Liste avec Route.getList
    this.controller.openapi(
      Route.getList('/users', {
        response: UserSchema
      }, {
        tag: 'Users',
        summary: 'Get users',
        security: true
      }),
      async (c) => {
        const query = c.req.valid('query')
        const users: User[] = []
        const total = 0
        
        return c.json({
          success: true,
          data: {
            items: users,
            pagination: {
              total,
              page: query.page,
              limit: query.limit,
              totalPages: Math.ceil(total / query.limit),
              hasNext: query.page < Math.ceil(total / query.limit),
              hasPrev: query.page > 1
            }
          }
        })
      }
    )

    // GET /users/{id}
    this.controller.openapi(
      Route.getById('/users/{id}', {
        response: UserSchema
      }, {
        tag: 'Users',
        summary: 'Get user by ID',
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        const user: User | null = null // Récupérer de la DB
        
        if (!user) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: user })
      }
    )

    // PUT /users/{id}
    this.controller.openapi(
      Route.put('/users/{id}', {
        request: UpdateUserSchema,
        response: UserSchema
      }, {
        tag: 'Users',
        summary: 'Update user',
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        const body = c.req.valid('json')
        const updatedUser: User | null = null // Mettre à jour en DB
        
        if (!updatedUser) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: updatedUser })
      }
    )

    // DELETE /users/{id}
    this.controller.openapi(
      Route.delete('/users/{id}', {
        tag: 'Users',
        summary: 'Delete user',
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        const deleted = true // Supprimer de la DB
        
        if (!deleted) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: { deleted: true } })
      }
    )
  }
}

/**
 * ✅ APPROCHE 3 - Combinaison Hybride (Le meilleur des deux mondes)
 * 
 * Utilise les méthodes du BaseController pour le CRUD simple
 * et Route.* pour les cas plus complexes
 */
export class HybridUserController extends BaseController {
  initRoutes() {
    // CRUD simple avec les méthodes BaseController
    this.createPostRoute('/users', {
      request: CreateUserSchema,
      response: UserSchema,
      summary: 'Create user'
    }, this.createUser.bind(this), { security: true })
    
    this.createListRoute('/users', {
      response: UserSchema,
      summary: 'Get users'
    }, this.getUsers.bind(this), { security: true })
    
    this.createGetByIdRoute('/users/{id}', {
      response: UserSchema,
      summary: 'Get user by ID'
    }, this.getUserById.bind(this), { security: true })

    // Route complexe avec Route.* pour plus de contrôle
    this.controller.openapi(
      Route.getList('/users/advanced-search', {
        response: UserSchema,
        query: z.object({
          role: z.enum(['admin', 'user', 'moderator']).optional(),
          isActive: z.boolean().optional(),
          createdAfter: z.string().datetime().optional()
        })
      }, {
        tag: 'Users',
        summary: 'Advanced user search',
        description: 'Search users with advanced filters',
        security: true
      }),
      this.advancedSearch.bind(this)
    )
  }

  private async createUser(c: any, body: z.infer<typeof CreateUserSchema>) {
    const newUser: User = {
      id: crypto.randomUUID(),
      ...body,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return c.json({ success: true, data: newUser }, 201)
  }

  private async getUsers(c: any, query: any) {
    const users: User[] = []
    const total = 0
    
    return c.json({
      success: true,
      data: {
        items: users,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
          hasNext: query.page < Math.ceil(total / query.limit),
          hasPrev: query.page > 1
        }
      }
    })
  }

  private async getUserById(c: any, id: string) {
    const user: User | null = null
    
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    return c.json({ success: true, data: user })
  }

  private async advancedSearch(c: any) {
    const query = c.req.valid('query')
    // Logique de recherche avancée...
    const users: User[] = []
    const total = 0
    
    return c.json({
      success: true,
      data: {
        items: users,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
          hasNext: query.page < Math.ceil(total / query.limit),
          hasPrev: query.page > 1
        }
      }
    })
  }
}

/**
 * 📊 COMPARAISON DES RÉSULTATS :
 * 
 * ❌ APPROCHE ORIGINALE:
 * - 40+ lignes par route
 * - Beaucoup de répétition
 * - Configuration manuelle complète
 * - Gestion d'erreur manuelle
 * 
 * ✅ MÉTHODES BASECONTROLLER:
 * - 15 lignes par route (-60%)
 * - Réponses standardisées
 * - Gestion d'erreur automatique
 * - Type safety complet
 * 
 * ✅ ROUTE UTILITY:
 * - 12 lignes par route (-70%)
 * - Plus flexible
 * - Réutilisable partout
 * - Composition facile
 * 
 * ✅ APPROCHE HYBRIDE:
 * - Le meilleur des deux
 * - CRUD simple = BaseController
 * - Cas complexes = Route.*
 * - Maintenabilité maximale
 * 
 * 🎯 RECOMMANDATION:
 * Utilisez l'approche HYBRIDE pour votre framework !
 */
