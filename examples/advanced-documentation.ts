import { 
  ArvoxFramework, 
  BaseController, 
  BaseUseCase, 
  BaseService, 
  IModule,
  DocumentationHelper 
} from '../src'
import { z } from 'zod'
import { OpenAPIHono } from '@hono/zod-openapi'

// Exemple d'entité User avec documentation complète
const UserSchema = z.object({
  id: z.string().uuid().describe('Identifiant unique de l\'utilisateur'),
  name: z.string().min(1).max(100).describe('Nom complet de l\'utilisateur'),
  email: z.string().email().describe('Adresse email unique'),
  role: z.enum(['admin', 'user', 'moderator']).describe('Rôle de l\'utilisateur'),
  isActive: z.boolean().describe('Statut actif de l\'utilisateur'),
  createdAt: z.date().describe('Date de création du compte'),
  updatedAt: z.date().describe('Date de dernière modification')
}).openapi({
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-08-05T12:00:00Z')
  }
})

// Schémas dérivés pour les opérations CRUD
const CreateUserSchema = DocumentationHelper.createCreateSchema(UserSchema)
const UpdateUserSchema = DocumentationHelper.createUpdateSchema(UserSchema)

// Use Case avec documentation
class GetUsersUseCase extends BaseUseCase<
  { page: number; limit: number; search?: string }, 
  { success: boolean; data: { items: any[]; pagination: any } }
> {
  async execute(params: { page: number; limit: number; search?: string }) {
    // Simulation de données
    const users = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '987fcdeb-51d2-43a1-b456-426614174111',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    return this.createSuccessResponse({
      items: users,
      pagination: {
        total: users.length,
        page: params.page,
        limit: params.limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    })
  }

  log() {
    return 'GET_USERS'
  }
}

class CreateUserUseCase extends BaseUseCase<any, { success: boolean; data: any }> {
  async execute(params: any) {
    const newUser = {
      id: crypto.randomUUID(),
      ...params,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return this.createSuccessResponse(newUser)
  }

  log() {
    return 'CREATE_USER'
  }
}

// Controller avec documentation OpenAPI complète
class UserController extends BaseController {
  constructor(
    private getUsersUseCase: GetUsersUseCase,
    private createUserUseCase: CreateUserUseCase
  ) {
    super()
  }

  initRoutes() {
    // Route GET /users avec pagination et recherche
    this.controller.openapi(
      DocumentationHelper.createListRoute({
        path: '/users',
        tag: 'Users',
        summary: 'Récupérer la liste des utilisateurs',
        description: `
Récupère une liste paginée des utilisateurs avec possibilité de recherche.

**Fonctionnalités:**
- Pagination avec paramètres \`page\` et \`limit\`
- Recherche par nom ou email avec le paramètre \`search\`
- Tri avec le paramètre \`sort\` (ex: \`-createdAt\` pour tri décroissant)

**Exemples d'utilisation:**
- \`GET /users\` - Première page avec 10 éléments
- \`GET /users?page=2&limit=20\` - Deuxième page avec 20 éléments
- \`GET /users?search=john\` - Recherche d'utilisateurs contenant "john"
- \`GET /users?sort=-createdAt\` - Tri par date de création décroissante
        `,
        responseSchema: UserSchema,
        security: true
      }),
      async (c) => {
        const { page, limit, search } = c.req.valid('query')
        const result = await this.getUsersUseCase.execute({ page, limit, search })
        return c.json(result)
      }
    )

    // Route GET /users/:id
    this.controller.openapi(
      DocumentationHelper.createGetByIdRoute({
        path: '/users/{id}',
        tag: 'Users',
        summary: 'Récupérer un utilisateur par ID',
        description: 'Récupère les détails complets d\'un utilisateur spécifique par son identifiant unique.',
        responseSchema: UserSchema,
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        // Simulation de récupération
        const user = {
          id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return c.json({ success: true, data: user })
      }
    )

    // Route POST /users
    this.controller.openapi(
      DocumentationHelper.createPostRoute({
        path: '/users',
        tag: 'Users',
        summary: 'Créer un nouvel utilisateur',
        description: `
Crée un nouveau compte utilisateur dans le système.

**Validation:**
- Le nom doit contenir entre 1 et 100 caractères
- L'email doit être valide et unique
- Le rôle doit être l'un des suivants: admin, user, moderator

**Comportement:**
- Un ID unique sera généré automatiquement
- Les dates \`createdAt\` et \`updatedAt\` seront définies automatiquement
- L'utilisateur sera actif par défaut
        `,
        requestSchema: CreateUserSchema,
        responseSchema: UserSchema,
        security: true
      }),
      async (c) => {
        const body = c.req.valid('json')
        const result = await this.createUserUseCase.execute(body)
        return c.json(result, 201)
      }
    )

    // Route PUT /users/:id
    this.controller.openapi(
      DocumentationHelper.createPutRoute({
        path: '/users/{id}',
        tag: 'Users',
        summary: 'Mettre à jour un utilisateur',
        description: 'Met à jour les informations d\'un utilisateur existant. Seuls les champs fournis seront modifiés.',
        requestSchema: UpdateUserSchema,
        responseSchema: UserSchema,
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        const body = c.req.valid('json')
        
        // Simulation de mise à jour
        const updatedUser = {
          id,
          name: 'John Doe Updated',
          email: 'john.updated@example.com',
          role: 'user' as const,
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date()
        }
        
        return c.json({ success: true, data: updatedUser })
      }
    )

    // Route DELETE /users/:id
    this.controller.openapi(
      DocumentationHelper.createDeleteRoute({
        path: '/users/{id}',
        tag: 'Users',
        summary: 'Supprimer un utilisateur',
        description: `
Supprime définitivement un utilisateur du système.

**⚠️ Attention:** Cette action est irréversible. L'utilisateur et toutes ses données associées seront supprimés.

**Permissions requises:** Seuls les administrateurs peuvent supprimer des utilisateurs.
        `,
        security: true
      }),
      async (c) => {
        const { id } = c.req.valid('param')
        // Simulation de suppression
        return c.json({ success: true, data: { deleted: true } })
      }
    )
  }
}

// Service et Module
class UserService extends BaseService {
  constructor() {
    super('UserService')
  }
}

class UserModule implements IModule {
  constructor(
    private userController: UserController,
    private userService: UserService
  ) {}

  getName(): string {
    return 'UserModule'
  }

  async initialize(): Promise<void> {
    await this.userService.initialize()
    console.log('User module with advanced documentation initialized')
  }

  registerRoutes(app: OpenAPIHono): void {
    app.route('/api/v1', this.userController.controller)
  }

  async cleanup(): Promise<void> {
    await this.userService.cleanup()
  }

  async healthCheck() {
    return { healthy: true, message: 'User module is healthy' }
  }
}

// Exemple avec documentation avancée
async function startAdvancedExample() {
  // Dependency injection
  const getUsersUseCase = new GetUsersUseCase()
  const createUserUseCase = new CreateUserUseCase()
  const userController = new UserController(getUsersUseCase, createUserUseCase)
  const userService = new UserService()
  const userModule = new UserModule(userController, userService)

  // Framework setup avec configuration OpenAPI avancée
  const framework = new ArvoxFramework({
    appName: 'Advanced API with Complete Documentation',
    version: '2.0.0',
    description: 'Exemple d\'API avec documentation OpenAPI complète utilisant @arvox/backend-framework',
    port: 3001,
    environment: 'development',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-API-Key']
    },
    logging: {
      requests: true,
      errors: true
    },
    swagger: {
      enabled: true,
      title: 'Advanced User Management API',
      description: 'API complète pour la gestion des utilisateurs',
      version: '2.0.0'
    }
  })

  // Configuration OpenAPI personnalisée
  framework.configureOpenAPI({
    contact: {
      name: 'Équipe API',
      email: 'api@example.com',
      url: 'https://example.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    tags: [
      {
        name: 'Users',
        description: 'Gestion complète des utilisateurs avec CRUD et recherche'
      },
      {
        name: 'Health',
        description: 'Endpoints de santé et monitoring'
      }
    ]
  })

  // Register module and service
  framework.registerModule(userModule)
  framework.registerService(userService)

  // Start the server
  await framework.start()
  
  console.log('\n🎉 Serveur démarré avec documentation avancée!')
  console.log('📚 Documentation complète disponible sur:')
  console.log('   • Swagger UI: http://localhost:3001/docs')
  console.log('   • OpenAPI JSON: http://localhost:3001/openapi.json')
  console.log('   • Health Check: http://localhost:3001/health')
  console.log('   • API Info: http://localhost:3001/info')
  console.log('   • Docs JSON: http://localhost:3001/docs/json')
  console.log('\n🧪 Endpoints de test:')
  console.log('   • GET http://localhost:3001/api/v1/users')
  console.log('   • POST http://localhost:3001/api/v1/users')
  console.log('   • GET http://localhost:3001/api/v1/users/{id}')
  console.log('   • PUT http://localhost:3001/api/v1/users/{id}')
  console.log('   • DELETE http://localhost:3001/api/v1/users/{id}')
}

export { startAdvancedExample }

// Exécuter si ce fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  startAdvancedExample().catch(console.error)
}
