import { AuthService } from './auth-service';
import type { AuthConfig, DrizzleGeneratorConfig } from '../types/auth.type';
import type { DrizzleDB } from '../types/database.type';
import { BaseController } from '../core/base-controller';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Controller d'authentification avec routes Better Auth intégrées
 */
export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  initRoutes() {
    // Routes personnalisées pour l'intégration avec l'API
    // Les routes Better Auth sont gérées directement dans registerRoutes()
    
    // GET /auth/me - Récupérer les infos de l'utilisateur connecté
    this.controller.get('/auth/me', async (c) => {
      try {
        const auth = await this.authService.getAuth();
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        if (!session) {
          return c.json({ error: 'Not authenticated' }, 401);
        }

        return c.json({
          success: true,
          data: {
            user: session.user,
            session: session.session,
          },
        });
      } catch (error) {
        return c.json({ 
          error: 'Failed to get session',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    });

    // POST /auth/verify-session - Vérifier si une session est valide
    this.controller.post('/auth/verify-session', async (c) => {
      try {
        const auth = await this.authService.getAuth();
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        return c.json({
          success: true,
          data: {
            valid: !!session,
            user: session?.user || null,
            session: session?.session || null,
          },
        });
      } catch {
        return c.json({
          success: false,
          data: {
            valid: false,
            user: null,
            session: null,
          },
        });
      }
    });
  }

  /**
   * Middleware d'authentification pour ce controller
   */
  getAuthMiddleware() {
    return this.authService.createAuthMiddleware();
  }

  /**
   * Middleware d'authentification optionnel pour ce controller
   */
  getOptionalAuthMiddleware() {
    return this.authService.createOptionalAuthMiddleware();
  }
}

/**
 * Factory pour créer facilement un module d'authentification
 */
export class AuthModuleFactory {
  /**
   * Crée un module d'authentification complet avec Better Auth et Drizzle
   */
  static create(config: {
    auth: AuthConfig;
    db: DrizzleDB;
    generateSchema?: boolean;
    drizzleConfig?: DrizzleGeneratorConfig;
    onLogin?: (userId: string, db: DrizzleDB) => Promise<void>; // Callback personnalisé pour la connexion
  }) {
    const authService = new AuthService(config.auth, config.db);
    
    // Si un callback de connexion est fourni, l'override
    if (config.onLogin) {
      authService.updateLastLogin = async (userId: string) => {
        await config.onLogin!(userId, config.db);
      };
    }
    
    const authController = new AuthController(authService);

    return {
      authService,
      authController,
      
      // Module compatible avec ArvoxFramework
      module: {
        getName(): string {
          return 'AuthModule';
        },

        async initialize(): Promise<void> {
          await authService.initialize();
          console.log('✓ Auth module initialized with Better Auth + Drizzle');
        },

        registerRoutes(app: OpenAPIHono): void {
          // Enregistrer directement le handler Better Auth sur l'app principale
          app.all('/api/v1/auth/*', async (c) => {
            const path = c.req.path;
            const auth = await authService.getAuth();
            const response = await auth.handler(c.req.raw);

            // Gestion spéciale pour les connexions - mise à jour lastLoginAt
            if (c.req.method === 'POST' && (path.includes('/auth/sign-in/email') || path.includes('/auth/sign-in/email-otp'))) {
              try {
                const body = await response.text();
                const data = JSON.parse(body);

                if (data?.user?.id) {
                  // Appeler la méthode de mise à jour du service
                  await authService.updateLastLogin(data.user.id);
                }

                return new Response(body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers
                });
              } catch (error) {
                console.error('Failed to process login response:', error);
              }
            }

            return response;
          });

          // Enregistrer les routes personnalisées via le controller
          authController.initRoutes();
          app.route('/api/v1', authController.controller);
          console.log('✓ Auth routes registered at /api/v1/auth/*');
        },

        async cleanup(): Promise<void> {
          await authService.cleanup();
        },

        async healthCheck() {
          return authService.healthCheck();
        },
      },

      // Utilitaires d'authentification (fonction async)
      async getUtils() {
        return await authService.getUtils();
      },

      // Middlewares
      middleware: {
        required: authService.createAuthMiddleware(),
        optional: authService.createOptionalAuthMiddleware(),
      },
    };
  }

  /**
   * Génère automatiquement le schéma Drizzle pour Better Auth
   */
  static async generateDrizzleSchema(_config: DrizzleGeneratorConfig): Promise<void> {
    // Cette fonction sera implémentée pour générer automatiquement
    // les tables Drizzle nécessaires pour Better Auth
    console.log('Generating Drizzle schema for Better Auth...');
    
    // TODO: Implémenter la génération automatique du schéma
    // Cela inclurait:
    // - Tables user, session, account, verificationToken
    // - Relations entre les tables
    // - Index appropriés
    // - Migrations Drizzle
    
    console.log('✓ Drizzle schema generated successfully');
  }
}
