# @arvox/backend-framework

# @armelwanes/backend-framework

Un framework backend TypeScript moderne basé sur Hono, conçu selon l'architecture hexagonale pour créer des APIs robustes et maintenables.

## ⚡ Installation rapide

Créez un nouveau projet avec le CLI :

```bash
npx create-arvox-app init mon-projet
cd mon-projet
npm run dev
```

Ou pour le développement local :
```bash
# Clone le framework
git clone <repo-url>
cd backend-framework

# Créer un nouveau projet
node bin/create-arvox-app.js init mon-projet
cd mon-projet
# Modifier package.json pour pointer vers le framework local
npm install
npm run dev
```

## 📦 Installation manuelle

```bash
npm install @armelwanes/backend-framework
# ou
bun add @armelwanes/backend-framework
# ou  
pnpm add @armelwanes/backend-framework
```

## 🚀 Simplification des routes

Le framework offre **3 approches** pour créer des routes avec **60-70% moins de code** :

### ✨ Méthode 1 : BaseController simplifié (Recommandé)

```typescript
import { BaseController } from '@armelwanes/backend-framework';

export class UserController extends BaseController {
  constructor() {
    super();
    this.setupRoutes();
  }

  private setupRoutes() {
    // ✅ AVANT : 40+ lignes de createRoute
    // ✅ APRÈS : 8 lignes avec méthodes simplifiées

    this.createPostRoute('/users', {
      body: z.object({
        name: z.string(),
        email: z.string().email()
      }),
      summary: 'Créer un utilisateur'
    }, async (c) => {
      // Votre logique métier ici
      return c.json({ success: true });
    });

    this.createListRoute('/users', {
      summary: 'Liste des utilisateurs',
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional()
      })
    }, async (c) => {
      // Pagination automatique incluse
      return c.json({ users: [] });
    });

    this.createGetByIdRoute('/users/:id', {
      summary: 'Obtenir un utilisateur par ID'
    }, async (c) => {
      const id = c.req.param('id');
      return c.json({ user: { id } });
    });
  }
}
```

### ⚡ Méthode 2 : Utilitaires Route

```typescript
import { Route } from '@armelwanes/backend-framework/utils';

// Configuration encore plus simple - style fonctionnel
const userRoutes = [
  Route.post('/users', {
    body: z.object({
      name: z.string(),
      email: z.string().email()
    }),
    summary: 'Créer un utilisateur'
  }, async (c) => {
    return c.json({ success: true });
  }),

  Route.getList('/users', {
    summary: 'Liste des utilisateurs'
  }, async (c) => {
    return c.json({ users: [] });
  }),

  Route.getById('/users/:id', {
    summary: 'Utilisateur par ID'
  }, async (c) => {
    return c.json({ user: { id: c.req.param('id') } });
  })
];
```

### � Méthode 3 : Hybride (Best of Both)

```typescript
export class UserController extends BaseController {
  constructor() {
    super();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Mélanger les deux approches selon les besoins
    this.createPostRoute('/users', userCreationConfig, this.createUser);
    
    // Ou utiliser les utilitaires directement
    this.addRoute(Route.delete('/users/:id', {
      summary: 'Supprimer un utilisateur'
    }, this.deleteUser));
  }

  private createUser = async (c) => { /* logic */ };
  private deleteUser = async (c) => { /* logic */ };
}
```

## 📊 Comparaison des méthodes

| Critère | Méthode 1 (BaseController) | Méthode 2 (Route Utils) | Méthode 3 (Hybride) |
|---------|---------------------------|------------------------|---------------------|
| **Réduction de code** | ~60% | ~70% | ~65% |
| **Lisibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilité** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Courbe d'apprentissage** | Facile | Très facile | Modérée |

## �🏗️ Architecture

Le framework suit l'architecture hexagonale :

```
src/
├── controllers/     # 🎮 Couche présentation (HTTP)
├── services/        # 💼 Couche application (logique métier)
├── repositories/    # 🗄️ Couche infrastructure (données)
├── use-cases/       # 🎯 Couche domaine (règles métier)
└── types/          # 📝 Types partagés
```

## � Fonctionnalités

- ✅ **Architecture hexagonale** prête à l'emploi
- ✅ **Validation Zod** automatique
- ✅ **Documentation OpenAPI** générée automatiquement
- ✅ **Pagination** intégrée
- ✅ **Gestion d'erreurs** standardisée
- ✅ **CLI de scaffolding** pour nouveaux projets
- ✅ **TypeScript** support complet
- ✅ **Performance** optimisée avec Hono

## �📚 Guide de démarrage

1. **Créer un projet** : `npx create-arvox-app init mon-api`
2. **Choisir votre approche** : BaseController, Route Utils, ou Hybride
3. **Développer** : `npm run dev`
4. **Tester** : Visitez `/health` et `/doc` 
5. **Déployer** : `npm run build && npm start`

## 📖 Exemples

Consultez le dossier `examples/` pour voir des implémentations complètes :
- [`simple-api.ts`](examples/simple-api.ts) : API basique avec CRUD
- [`advanced-documentation.ts`](examples/advanced-documentation.ts) : Documentation OpenAPI avancée

## 🔧 CLI

Le CLI `create-arvox-app` génère des projets préconfigurés :

```bash
# Nouveau projet avec npm
npx create-arvox-app init mon-projet

# Avec bun
npx create-arvox-app init mon-projet --package-manager bun

# Avec pnpm  
npx create-arvox-app init mon-projet --package-manager pnpm
```

Le projet généré inclut :
- 📁 Structure de dossiers optimisée
- 🏥 Contrôleur Health avec endpoint `/health`
- 📖 Documentation automatique sur `/doc`
- ⚙️ Configuration TypeScript/ESLint
- 🔥 Hot reload avec `tsx`

---

**🎯 Objectif** : Réduire la verbosité du code de 60-70% tout en gardant la flexibilité et la robustesse.

## 🚀 Fonctionnalités

- **Architecture Hexagonale** : Séparation claire entre Domain, Application et Infrastructure
- **TypeScript First** : Type safety complet avec Zod pour la validation
- **OpenAPI/Swagger** : Documentation API automatique
- **Modulaire** : Système de modules et services extensible
- **Hono Framework** : Performance optimale avec support moderne
- **Classes de Base** : UseCase, Controller, Repository, Service prêts à l'emploi
- **Utilitaires** : Pagination, validation, gestion des réponses standardisées

## 📦 Installation

```bash
npm install @arvox/backend-framework
# ou
bun add @arvox/backend-framework
```

## 🏗️ Architecture

```
src/
├── domain/           # Couche métier (entités, interfaces, types)
├── application/      # Couche application (cas d'usage, services)
└── infrastructure/   # Couche infrastructure (controllers, DB, APIs externes)
```

## 🚀 Démarrage Rapide

### 1. Configuration de Base

```typescript
import { ArvoxFramework } from '@arvox/backend-framework'

const framework = new ArvoxFramework({
  appName: 'Mon API',
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

// Démarrer l'application
await framework.start()
```

### 2. Créer un Use Case

```typescript
import { BaseUseCase, ActivityType } from '@arvox/backend-framework'

type CreateUserParams = {
  name: string
  email: string
}

type CreateUserResponse = {
  success: boolean
  data?: User
  error?: string
}

export class CreateUserUseCase extends BaseUseCase<CreateUserParams, CreateUserResponse> {
  constructor(private userRepository: UserRepository) {
    super()
  }

  async execute(params: CreateUserParams): Promise<CreateUserResponse> {
    try {
      const user = await this.userRepository.create(params)
      return this.createSuccessResponse(user)
    } catch (error) {
      return this.handleError(error)
    }
  }

  log(): ActivityType {
    return ActivityType.CREATE_USER
  }
}
```

### 3. Créer un Controller

```typescript
import { BaseController, Route } from '@arvox/backend-framework'
import { z } from 'zod'

// Schémas simplifiés
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string()
})

export class UserController extends BaseController {
  constructor(private createUserUseCase: CreateUserUseCase) {
    super()
  }

  initRoutes() {
    // ✨ APPROCHE SIMPLIFIÉE - 70% moins de code !
    
    // POST /users avec createPostRoute (méthode BaseController)
    this.createPostRoute(
      '/users',
      {
        request: CreateUserSchema,
        response: UserSchema,
        summary: 'Create user',
        description: 'Create a new user in the system'
      },
      async (c, body) => {
        const result = await this.createUserUseCase.execute(body)
        return result.success 
          ? c.json(result, 201)
          : c.json(result, 400)
      },
      { security: true } // Options : sécurité, multipart, etc.
    )

    // Alternative avec Route utility
    this.controller.openapi(
      Route.post('/users-alt', {
        request: CreateUserSchema,
        response: UserSchema
      }, {
        tag: 'Users',
        summary: 'Create user (alternative)',
        security: true
      }),
      async (c) => {
        const body = c.req.valid('json')
        const result = await this.createUserUseCase.execute(body)
        return result.success 
          ? c.json(result, 201)
          : c.json(result, 400)
      }
    )

    // GET /users avec pagination automatique
    this.createListRoute(
      '/users',
      {
        response: UserSchema,
        summary: 'Get users list',
        description: 'Retrieve paginated list of users'
      },
      async (c, query) => {
        // query contient automatiquement : { page, limit, search, sort }
        const users = [] // Votre logique ici
        const total = 0
        
        return c.json({
          success: true,
          data: {
            items: users,
            pagination: {
              total, page: query.page, limit: query.limit,
              totalPages: Math.ceil(total / query.limit),
              hasNext: query.page < Math.ceil(total / query.limit),
              hasPrev: query.page > 1
            }
          }
        })
      },
      { security: true }
    )

    // GET /users/{id}
    this.createGetByIdRoute(
      '/users/{id}',
      {
        response: UserSchema,
        summary: 'Get user by ID'
      },
      async (c, id) => {
        const user = null // Votre logique de récupération
        return user 
          ? c.json({ success: true, data: user })
          : c.json({ success: false, error: 'User not found' }, 404)
      },
      { security: true }
    )

    // PUT /users/{id}
    this.createPutRoute(
      '/users/{id}',
      {
        request: CreateUserSchema.partial(), // Schema de mise à jour
        response: UserSchema,
        summary: 'Update user'
      },
      async (c, id, body) => {
        const updatedUser = null // Votre logique de mise à jour
        return updatedUser
          ? c.json({ success: true, data: updatedUser })
          : c.json({ success: false, error: 'User not found' }, 404)
      },
      { security: true }
    )

    // DELETE /users/{id}
    this.createDeleteRoute(
      '/users/{id}',
      {
        summary: 'Delete user'
      },
      async (c, id) => {
        const deleted = true // Votre logique de suppression
        return deleted
          ? c.json({ success: true, data: { deleted: true } })
          : c.json({ success: false, error: 'User not found' }, 404)
      },
      { security: true }
    )
  }
}
```

### 4. Créer un Repository

```typescript
import { BaseRepository } from '@arvox/backend-framework'

export class UserRepository extends BaseRepository<User, CreateUserData, UpdateUserData> {
  async findById(id: string): Promise<User | null> {
    // Implémentation avec votre ORM (Drizzle, Prisma, etc.)
  }

  async findAll(pagination?: { skip: number; limit: number }): Promise<User[]> {
    // Implémentation avec pagination
  }

  async create(data: CreateUserData): Promise<User> {
    // Implémentation de création
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    // Implémentation de mise à jour
  }

  async delete(id: string): Promise<boolean> {
    // Implémentation de suppression
  }

  async count(): Promise<number> {
    // Implémentation du comptage
  }
}
```

### 5. Créer un Module

```typescript
import { IModule } from '@arvox/backend-framework'
import { OpenAPIHono } from '@hono/zod-openapi'

export class UserModule implements IModule {
  constructor(
    private userController: UserController
  ) {}

  getName(): string {
    return 'UserModule'
  }

  async initialize(): Promise<void> {
    console.log('User module initialized')
  }

  registerRoutes(app: OpenAPIHono): void {
    app.route('/api/v1', this.userController.controller)
  }

  async cleanup(): Promise<void> {
    console.log('User module cleaned up')
  }
}
```

### 6. Assemblage Final

```typescript
import { ArvoxFramework } from '@arvox/backend-framework'

// Injection de dépendances
const userRepository = new UserRepository()
const createUserUseCase = new CreateUserUseCase(userRepository)
const userController = new UserController(createUserUseCase)
const userModule = new UserModule(userController)

// Configuration du framework
const framework = new ArvoxFramework({
  appName: 'Mon API',
  version: '1.0.0',
  port: 3000
})

// Enregistrement du module
framework.registerModule(userModule)

// Démarrage
await framework.start()
```

## 🛠️ Utilitaires Inclus

### Simplification des Routes

Le framework offre plusieurs approches pour simplifier la création de routes OpenAPI :

#### 🚀 Méthodes BaseController (Recommandé)

```typescript
// Au lieu de 40+ lignes avec createRoute, utilisez :
this.createPostRoute('/users', {
  request: CreateUserSchema,
  response: UserSchema,
  summary: 'Create user'
}, async (c, body) => {
  // Votre logique ici
}, { security: true })

// Autres méthodes disponibles :
this.createListRoute()      // GET avec pagination
this.createGetByIdRoute()   // GET /{id}
this.createPutRoute()       // PUT /{id}
this.createDeleteRoute()    // DELETE /{id}
```

#### ⚡ Route Utilities

```typescript
import { Route } from '@arvox/backend-framework'

// Pour plus de flexibilité :
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
    // Votre handler ici
  }
)
```

#### 📊 Avantages de la Simplification

| Approche | Lignes de Code | Avantages |
|----------|----------------|-----------|
| `createRoute` original | ~40 lignes | Contrôle total |
| Méthodes `BaseController` | ~15 lignes | -60% code, type safety |
| `Route` utilities | ~12 lignes | -70% code, réutilisable |

**Fonctionnalités automatiques :**
- ✅ Schémas de réponse standardisés
- ✅ Gestion d'erreurs communes (400, 401, 404)
- ✅ Documentation OpenAPI complète
- ✅ Validation automatique des paramètres
- ✅ Type safety complet avec TypeScript

### Validation

```typescript
import { ValidationUtil } from '@arvox/backend-framework'

// Schémas prédéfinis
const user = ValidationUtil.validate(data, z.object({
  email: ValidationUtil.emailSchema,
  password: ValidationUtil.passwordSchema
}))

// Validation de fichiers
const fileSchema = ValidationUtil.createFileSchema(['image/jpeg', 'image/png'], 5 * 1024 * 1024)
```

### Pagination

```typescript
import { PaginationUtil } from '@arvox/backend-framework'

const paginationUtil = new PaginationUtil()
const { page, limit, skip } = paginationUtil.extractFromContext(c)
const result = paginationUtil.createResponse(items, total, page, limit)
```

### Réponses Standardisées

```typescript
import { ResponseUtil } from '@arvox/backend-framework'

const responseUtil = new ResponseUtil()

// Réponses de succès
return responseUtil.success(data)
return responseUtil.paginated(items, total, page, limit)

// Réponses d'erreur
return responseUtil.error('Message d\'erreur')
return responseUtil.notFound('User')
return responseUtil.unauthorized()
```

## 📚 Documentation API

Une fois votre application démarrée, la documentation Swagger est automatiquement disponible sur :
- Documentation interactive : `http://localhost:3000/docs`
- Spécification OpenAPI : `http://localhost:3000/openapi.json`

## 🔧 Configuration Avancée

```typescript
const framework = new ArvoxFramework({
  appName: 'Mon API',
  version: '1.0.0',
  port: 3000,
  environment: 'production',
  
  // Configuration CORS
  cors: {
    origin: ['https://monsite.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization']
  },
  
  // Configuration des logs
  logging: {
    requests: true,
    errors: true
  },
  
  // Configuration de sécurité
  security: {
    headers: true
  }
})
```

## 🧪 Tests

Le framework inclut des classes de base qui facilitent les tests unitaires :

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let mockRepository: UserRepository

  beforeEach(() => {
    mockRepository = {
      create: vi.fn()
    } as any
    useCase = new CreateUserUseCase(mockRepository)
  })

  it('should create user successfully', async () => {
    const userData = { name: 'John', email: 'john@example.com' }
    const mockUser = { id: '1', ...userData }
    
    vi.mocked(mockRepository.create).mockResolvedValue(mockUser)

    const result = await useCase.execute(userData)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockUser)
  })
})
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de suivre les guidelines du projet.

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.
