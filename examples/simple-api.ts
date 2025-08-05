import { ArvoxFramework, BaseController, BaseUseCase, BaseService, IModule } from '../src'
import { createRoute, z } from '@hono/zod-openapi'
import { OpenAPIHono } from '@hono/zod-openapi'

// Simple User model
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// Simple Use Case
class GetUsersUseCase extends BaseUseCase<void, { success: boolean; data: User[] }> {
  async execute(): Promise<{ success: boolean; data: User[] }> {
    const users: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    return this.createSuccessResponse(users)
  }

  log(): any {
    return 'GET_USERS'
  }
}

// Simple Controller
class UserController extends BaseController {
  constructor(private getUsersUseCase: GetUsersUseCase) {
    super()
  }

  initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/users',
        tags: ['Users'],
        summary: 'Get all users',
        responses: {
          200: {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string()
                  }))
                })
              }
            }
          }
        }
      }),
      async (c) => {
        const result = await this.getUsersUseCase.execute()
        return c.json(result)
      }
    )
  }
}

// Simple Service
class UserService extends BaseService {
  constructor() {
    super('UserService')
  }

  async initialize(): Promise<void> {
    this.log('info', 'User service initializing...')
  }
}

// Simple Module
class UserModule implements IModule {
  constructor(private userController: UserController, private userService: UserService) {}

  getName(): string {
    return 'UserModule'
  }

  async initialize(): Promise<void> {
    await this.userService.initialize()
    console.log('User module initialized')
  }

  registerRoutes(app: OpenAPIHono): void {
    app.route('/api/v1', this.userController.controller)
  }

  async cleanup(): Promise<void> {
    await this.userService.cleanup()
    console.log('User module cleaned up')
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: 'User module is healthy' }
  }
}

// Example usage
async function startExample() {
  // Dependency injection
  const getUsersUseCase = new GetUsersUseCase()
  const userController = new UserController(getUsersUseCase)
  const userService = new UserService()
  const userModule = new UserModule(userController, userService)

  // Framework setup
  const framework = new ArvoxFramework({
    appName: 'Simple API Example',
    version: '1.0.0',
    port: 3000,
    environment: 'development',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization']
    },
    logging: {
      requests: true,
      errors: true
    }
  })

  // Register module and service
  framework.registerModule(userModule)
  framework.registerService(userService)

  // Start the server
  await framework.start()
}

// Export for potential use
export { startExample }

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startExample().catch(console.error)
}
