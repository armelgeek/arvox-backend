/**
 * Types pour la base de données Drizzle
 */
export type DrizzleDB = any; // À remplacer par le type Drizzle approprié selon la config

/**
 * Configuration pour la connexion à la base de données
 */
export interface DatabaseConfig {
  provider: 'postgresql' | 'mysql' | 'sqlite';
  url: string;
  authToken?: string; // Pour SQLite/Turso
  ssl?: boolean;
  migrationFolder?: string;
}

/**
 * Types pour les entités d'authentification
 */
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
