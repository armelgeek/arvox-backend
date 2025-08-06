// @ts-ignore - Better Auth types might not be available
import { betterAuth } from 'better-auth';
// @ts-ignore - Drizzle adapter types might not be available  
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { BaseService } from '../core/base-service';
import type { AuthConfig } from '../types/auth.type';
import type { DrizzleDB } from '../types/database.type';
import type { Context, Next } from 'hono';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { Hono } from 'hono';

/**
 * Service d'authentification basé sur Better Auth
 * Intégré nativement dans le framework Arvox
 */
export class AuthService extends BaseService {
  private authInstance: ReturnType<typeof betterAuth> | null = null;
  private config: AuthConfig;
  private db: DrizzleDB;
  private router: Hono;

  constructor(config: AuthConfig, db: DrizzleDB) {
    super('AuthService');
    this.config = config;
    this.db = db;
    this.router = new Hono({
      strict: false,
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing Better Auth service...');
    
    // Validation de la configuration
    if (!this.config.secret) {
      throw new Error('BETTER_AUTH_SECRET is required');
    }
    
    if (!this.config.baseURL) {
      throw new Error('BETTER_AUTH_URL is required');
    }

    // Configuration Better Auth avec Drizzle
    this.authInstance = betterAuth({
      database: drizzleAdapter(this.db, {
        provider: this.config.database?.provider === 'postgresql' ? 'pg' : this.config.database?.provider || 'pg',
        schema: this.config.database?.schema,
      }),
      secret: this.config.secret,
      baseURL: this.config.baseURL,
      trustedOrigins: this.config.trustedOrigins || ['http://localhost:3000'],
      
      // Activer la documentation Better Auth
      disableDefaultRoutes: false,
      enableAPI: true,
      
      // Configuration email/password
      emailAndPassword: {
        enabled: this.config.emailAndPassword?.enabled ?? true,
        requireEmailVerification: this.config.emailAndPassword?.requireEmailVerification ?? false,
        minPasswordLength: this.config.emailAndPassword?.minPasswordLength ?? 8,
        maxPasswordLength: this.config.emailAndPassword?.maxPasswordLength ?? 128,
      },

      // Configuration des providers sociaux
      socialProviders: this.config.socialProviders || {},

      // Configuration des sessions
      session: {
        expiresIn: this.config.session?.expiresIn ?? 60 * 60 * 24 * 7, // 7 jours
        updateAge: this.config.session?.updateAge ?? 60 * 60 * 24, // 1 jour
      },

      // Configuration des plugins
      plugins: this.config.plugins || [],

      // Callbacks personnalisés
      callbacks: {
        ...this.config.callbacks,
      },

      // Configuration avancée
      advanced: {
        generateId: this.config.advanced?.generateId,
        crossSubDomainCookies: this.config.advanced?.crossSubDomainCookies,
        useSecureCookies: this.config.advanced?.useSecureCookies ?? process.env.NODE_ENV === 'production',
        ...this.config.advanced,
      },
    });

    
    console.log('✓ Better Auth service initialized');
  }

  /**
   * Récupère l'instance Better Auth
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAuth(): Promise<any> {
    if (!this.authInstance) {
      await this.initialize();
    }
    return this.authInstance;
  }

  /**
   * Handler pour les requêtes d'authentification
   * À utiliser dans les routes /auth/*
   */
  async getHandler() {
    const auth = await this.getAuth();
    return auth.handler;
  }

  /**
   * Middleware d'authentification pour protéger les routes
   */
  createAuthMiddleware() {
    return async (c: Context, next: Next) => {
      const auth = await this.getAuth();
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Ajouter les données d'authentification au contexte
      c.set('user', session.user);
      c.set('session', session.session);
      
      await next();
    };
  }

  /**
   * Middleware d'authentification optionnel
   * N'interrompt pas la requête si non authentifié
   */
  createOptionalAuthMiddleware() {
    return async (c: Context, next: Next) => {
      try {
        const auth = await this.getAuth();
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        if (session) {
          c.set('user', session.user);
          c.set('session', session.session);
        }
      } catch (error) {
        // Ignorer les erreurs d'authentification en mode optionnel
        console.warn('Optional auth middleware error:', error);
      }
      
      await next();
    };
  }

  /**
   * Utilitaires d'authentification
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUtils(): Promise<any> {
    const auth = await this.getAuth();
    
    return {
      // Créer un utilisateur
      createUser: auth.api.signUpEmail,
      
      // Connexion
      signIn: auth.api.signInEmail,
      
      // Déconnexion
      signOut: auth.api.signOut,
      
      // Récupérer une session
      getSession: auth.api.getSession,
      
      // Vérifier un email
      verifyEmail: auth.api.verifyEmail,
      
      // Réinitialiser le mot de passe
      forgetPassword: auth.api.forgetPassword,
      resetPassword: auth.api.resetPassword,
      
      // Gestion des comptes sociaux
      linkSocialAccount: auth.api.linkSocialAccount,
      
      // Gestion du profil
      updateUser: auth.api.updateUser,
      deleteUser: auth.api.deleteUser,
    };
  }

  async updateLastLogin(userId: string): Promise<void> {
    // Cette méthode peut être overridée dans les projets pour gérer lastLoginAt
    // Par défaut, elle ne fait rien car elle dépend du schéma de base de données
    console.log(`User ${userId} logged in - override updateLastLogin() to track this`);
  }

  async cleanup(): Promise<void> {
    // Cleanup si nécessaire
    this.authInstance = null;
    console.log('✓ Auth service cleaned up');
  }
  async initRoutes(app: OpenAPIHono): Promise<void> {
    const auth = await this.getAuth();
    
    // Enregistrer les routes d'authentification
    app.all('/api/v1/auth/*', async (c: Context) => {
      const path = c.req.path;
      const response = await auth.handler(c.req.raw);

      // Gestion spéciale pour les connexions - mise à jour lastLoginAt
      if (c.req.method === 'POST' && (path.includes('/auth/sign-in/email') || path.includes('/auth/sign-in/email-otp'))) {
        try {
          const body = await response.text();
          const data = JSON.parse(body);

          if (data?.user?.id) {
            // Appeler la méthode de mise à jour du service
            await this.updateLastLogin(data.user.id);
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

    console.log('✓ Auth routes registered at /api/v1/auth/*');
  }
  async healthCheck() {
    try {
      if (!this.authInstance) {
        return { healthy: false, message: 'Auth service not initialized' };
      }
      
      // Test basique de fonctionnement
      return { healthy: true, message: 'Auth service is healthy' };
    } catch (error) {
      return { 
        healthy: false, 
        message: `Auth service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
