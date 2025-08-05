import { BaseController } from '../src/core/base-controller'
import { z } from 'zod'

// Schémas de validation pour l'utilisateur
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']).default('user')
})

const UpdateUserSchema = CreateUserSchema.partial()

type User = z.infer<typeof UserSchema>
type CreateUser = z.infer<typeof CreateUserSchema>
type UpdateUser = z.infer<typeof UpdateUserSchema>

/**
 * Exemple de contrôleur utilisant les méthodes simplifiées
 */
export class SimplifiedUserController extends BaseController {
  initRoutes() {
    // ✨ AVANT - Code verbeux avec createRoute
    /*
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
        // Logic here...
        return c.json({ success: true, data: mockUser }, 201)
      }
    )
    */

    // 🚀 APRÈS - Code simplifié avec les nouvelles méthodes
    
    // POST /users - Créer un utilisateur
    this.createPostRoute(
      '/users',
      {
        request: CreateUserSchema,
        response: UserSchema,
        summary: 'Create user',
        description: 'Create a new user in the system'
      },
      async (c, body) => {
        // Votre logique de création ici
        const newUser: User = {
          id: crypto.randomUUID(),
          ...body,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        return c.json({ success: true, data: newUser }, 201)
      },
      { security: true } // Optionnel : authentification requise
    )

    // GET /users - Liste des utilisateurs avec pagination
    this.createListRoute(
      '/users',
      {
        response: UserSchema,
        summary: 'Get users',
        description: 'Retrieve a paginated list of users'
      },
      async (c, query) => {
        // Votre logique de récupération ici
        const users: User[] = [] // Récupérer depuis la base de données
        const total = 0 // Compter le total
        
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
      },
      { security: true }
    )

    // GET /users/{id} - Récupérer un utilisateur par ID
    this.createGetByIdRoute(
      '/users/{id}',
      {
        response: UserSchema,
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID'
      },
      async (c, id) => {
        // Votre logique de récupération ici
        const user: User | null = null // Récupérer depuis la base de données
        
        if (!user) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: user })
      },
      { security: true }
    )

    // PUT /users/{id} - Mettre à jour un utilisateur
    this.createPutRoute(
      '/users/{id}',
      {
        request: UpdateUserSchema,
        response: UserSchema,
        summary: 'Update user',
        description: 'Update an existing user'
      },
      async (c, id, body) => {
        // Votre logique de mise à jour ici
        const updatedUser: User | null = null // Mettre à jour en base de données
        
        if (!updatedUser) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: updatedUser })
      },
      { security: true }
    )

    // DELETE /users/{id} - Supprimer un utilisateur
    this.createDeleteRoute(
      '/users/{id}',
      {
        summary: 'Delete user',
        description: 'Delete a user from the system'
      },
      async (c, id) => {
        // Votre logique de suppression ici
        const deleted = true // Supprimer de la base de données
        
        if (!deleted) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }
        
        return c.json({ success: true, data: { deleted: true } })
      },
      { security: true }
    )
  }

  // Personnaliser le tag et le nom de ressource pour ce contrôleur
  protected getDefaultTag(): string {
    return 'Users'
  }

  protected getResourceName(): string {
    return 'user'
  }
}

/**
 * Comparaison des approches :
 * 
 * AVANT (avec createRoute) :
 * - ~40 lignes de code pour une route POST simple
 * - Répétition du schema de réponse pour chaque route
 * - Configuration manuelle des status codes et descriptions
 * - Gestion manuelle des erreurs communes (400, 401, 404)
 * 
 * APRÈS (avec méthodes simplifiées) :
 * - ~15 lignes de code pour une route POST simple
 * - Schemas automatiques pour les réponses standardisées
 * - Status codes et descriptions générés automatiquement
 * - Gestion automatique des erreurs communes
 * - Configuration centralisée via les options
 * 
 * AVANTAGES :
 * ✅ 60% moins de code
 * ✅ Consistency automatique
 * ✅ Moins d'erreurs de configuration
 * ✅ Maintenance simplifiée
 * ✅ Garde toute la flexibilité de Hono et OpenAPI
 */
