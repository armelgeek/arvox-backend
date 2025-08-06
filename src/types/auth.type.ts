import type { Context, Next } from 'hono';

/**
 * Configuration pour Better Auth
 */
export interface AuthConfig {
  // Configuration de base
  secret: string;
  baseURL: string;
  trustedOrigins?: string[];

  // Configuration de la base de données
  database?: {
    provider?: 'postgresql' | 'mysql' | 'sqlite';
    schema?: any;
  };

  // Configuration email/password
  emailAndPassword?: {
    enabled?: boolean;
    requireEmailVerification?: boolean;
    minPasswordLength?: number;
    maxPasswordLength?: number;
  };

  // Configuration des providers sociaux
  socialProviders?: {
    github?: {
      clientId: string;
      clientSecret: string;
    };
    google?: {
      clientId: string;
      clientSecret: string;
    };
    discord?: {
      clientId: string;
      clientSecret: string;
    };
    facebook?: {
      clientId: string;
      clientSecret: string;
    };
    twitter?: {
      clientId: string;
      clientSecret: string;
    };
    apple?: {
      clientId: string;
      clientSecret: string;
    };
    microsoft?: {
      clientId: string;
      clientSecret: string;
    };
  };

  // Configuration des sessions
  session?: {
    expiresIn?: number;
    updateAge?: number;
    cookieCache?: boolean;
  };

  // Plugins Better Auth
  plugins?: any[];

  // Callbacks personnalisés
  callbacks?: {
    signIn?: (user: any, account: any) => Promise<boolean> | boolean;
    signUp?: (user: any) => Promise<boolean> | boolean;
    session?: (session: any, user: any) => Promise<any> | any;
  };

  // Configuration avancée
  advanced?: {
    generateId?: () => string;
    crossSubDomainCookies?: {
      enabled: boolean;
      domain: string;
    };
    useSecureCookies?: boolean;
    rateLimit?: {
      enabled: boolean;
      requests: number;
      window: number;
    };
  };
}

/**
 * Types pour les contextes d'authentification
 */
export interface AuthContext extends Context {
  get(key: 'user'): any | undefined;
  get(key: 'session'): any | undefined;
  set(key: 'user', value: any): void;
  set(key: 'session', value: any): void;
}

/**
 * Middleware d'authentification
 */
export type AuthMiddleware = (c: AuthContext, next: Next) => Promise<Response | void>;

/**
 * Configuration pour le générateur Drizzle
 */
export interface DrizzleGeneratorConfig {
  // Configuration de la base de données
  database: {
    provider: 'postgresql' | 'mysql' | 'sqlite';
    url: string;
    authToken?: string; // Pour SQLite/Turso
  };

  // Configuration des fichiers générés
  output: {
    schema: string; // Chemin du fichier schema
    migrations: string; // Dossier des migrations
    client: string; // Fichier client de base de données
  };

  // Tables d'authentification à générer
  tables?: {
    user?: boolean;
    session?: boolean;
    account?: boolean;
    verificationToken?: boolean;
    passwordResetToken?: boolean;
  };

  // Configuration des champs personnalisés
  customFields?: {
    user?: Record<string, any>;
    session?: Record<string, any>;
    account?: Record<string, any>;
  };
}

/**
 * Utilitaires d'authentification
 */
export interface AuthUtils {
  createUser: (data: any) => Promise<any>;
  signIn: (data: any) => Promise<any>;
  signOut: (data: any) => Promise<any>;
  getSession: (data: any) => Promise<any>;
  verifyEmail: (data: any) => Promise<any>;
  forgetPassword: (data: any) => Promise<any>;
  resetPassword: (data: any) => Promise<any>;
  linkSocialAccount: (data: any) => Promise<any>;
  unlinkSocialAccount: (data: any) => Promise<any>;
  updateUser: (data: any) => Promise<any>;
  deleteUser: (data: any) => Promise<any>;
}
