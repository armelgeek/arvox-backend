import { promises as fs } from 'fs';
import { join } from 'path';
import type { DrizzleGeneratorConfig } from '../types/auth.type';

/**
 * Générateur de schéma Drizzle pour Better Auth
 * Crée automatiquement les tables et migrations nécessaires
 */
export class DrizzleAuthGenerator {
  constructor(private config: DrizzleGeneratorConfig) {}

  /**
   * Génère le schéma Drizzle complet pour Better Auth
   */
  async generateSchema(): Promise<void> {
    console.log('🔄 Generating Drizzle schema for Better Auth...');

    // Créer les dossiers nécessaires
    await this.ensureDirectories();

    // Générer le schéma principal
    await this.generateMainSchema();

    // Générer le client de base de données
    await this.generateDatabaseClient();

    // Générer la configuration Drizzle
    await this.generateDrizzleConfig();

    // Générer les migrations initiales
    await this.generateInitialMigration();

    console.log('✅ Drizzle schema generated successfully!');
    console.log(`📁 Schema: ${this.config.output.schema}`);
    console.log(`📁 Migrations: ${this.config.output.migrations}`);
    console.log(`📁 Client: ${this.config.output.client}`);
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.getDirectory(this.config.output.schema),
      this.config.output.migrations,
      this.getDirectory(this.config.output.client),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private getDirectory(filePath: string): string {
    return filePath.substring(0, filePath.lastIndexOf('/'));
  }

  private async generateMainSchema(): Promise<void> {
    const schemaContent = this.getSchemaContent();
    await fs.writeFile(this.config.output.schema, schemaContent, 'utf-8');
  }

  private getSchemaContent(): string {
    const { provider } = this.config.database;
    const imports = this.getImports(provider);
    const tables = this.getTableDefinitions(provider);
    const relations = this.getRelations();

    return `${imports}

${tables}

${relations}

// Export all tables
export { users, sessions, accounts, verifications };
`;
  }

  private getImports(provider: string): string {
    const baseImports = [
      'pgTable',
      'text',
      'timestamp',
      'boolean',
    ];

    switch (provider) {
      case 'postgresql':
        return `import { ${baseImports.join(', ')} } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';`;
      
      case 'mysql':
        return `import { mysqlTable as table, varchar, timestamp, boolean, int } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';`;
      
      case 'sqlite':
        return `import { sqliteTable as table, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';`;
      
      default:
        throw new Error(`Unsupported database provider: ${provider}`);
    }
  }

  private getTableDefinitions(provider: string): string {
    switch (provider) {
      case 'postgresql':
        return this.getPostgreSQLTables();
      case 'mysql':
        return this.getMySQLTables();
      case 'sqlite':
        return this.getSQLiteTables();
      default:
        throw new Error(`Unsupported database provider: ${provider}`);
    }
  }

  private getPostgreSQLTables(): string {
    return `// User table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  email: text('email').notNull().unique(),
  lastLoginAt: timestamp('last_login_at'),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role').notNull().default('user'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  impersonatedBy: text('impersonated_by').references(() => users.id)
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});`;
  }

  private getMySQLTables(): string {
    return `// User table
export const user = table('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Session table
export const session = table('session', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Account table
export const account = table('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: varchar('scope', { length: 255 }),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Verification token table
export const verificationToken = table('verification_token', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});`;
  }

  private getSQLiteTables(): string {
    return `// User table
export const user = table('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Session table
export const session = table('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Account table
export const account = table('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Verification token table
export const verificationToken = table('verification_token', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});`;
  }

  private getRelations(): string {
    return `// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  impersonatedByUser: one(users, {
    fields: [sessions.impersonatedBy],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));`;
  }

  private async generateDatabaseClient(): Promise<void> {
    const clientContent = this.getDatabaseClientContent();
    await fs.writeFile(this.config.output.client, clientContent, 'utf-8');
  }

  private getDatabaseClientContent(): string {
    const { provider, url } = this.config.database;

    switch (provider) {
      case 'postgresql':
        return `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connection = postgres('${url}');

// Create the database instance
export const db = drizzle(connection, { schema });

export type Database = typeof db;
export { schema };`;

      case 'mysql':
        return `import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create the connection
const connection = mysql.createPool('${url}');

// Create the database instance
export const db = drizzle(connection, { schema, mode: 'default' });

export type Database = typeof db;
export { schema };`;

      case 'sqlite':
        return `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Create the connection
const sqlite = new Database('${url}');

// Create the database instance
export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
export { schema };`;

      default:
        throw new Error(`Unsupported database provider: ${provider}`);
    }
  }

  private async generateDrizzleConfig(): Promise<void> {
    const configContent = this.getDrizzleConfigContent();
    const configPath = join(process.cwd(), 'drizzle.config.ts');
    await fs.writeFile(configPath, configContent, 'utf-8');
  }

  private getDrizzleConfigContent(): string {
    const { provider, url } = this.config.database;
    
    return `import type { Config } from 'drizzle-kit';

export default {
  schema: '${this.config.output.schema}',
  out: '${this.config.output.migrations}',
  driver: '${provider}',
  dbCredentials: {
    ${provider === 'sqlite' ? `url: '${url}'` : `connectionString: '${url}'`}
  },
  verbose: true,
  strict: true,
} satisfies Config;`;
  }

  private async generateInitialMigration(): Promise<void> {
    // Créer un script de migration initiale
    const migrationScript = `#!/bin/bash

echo "🔄 Running initial migration for Better Auth..."

# Install dependencies if not present
if ! command -v drizzle-kit &> /dev/null; then
    echo "Installing drizzle-kit..."
    npm install -D drizzle-kit
fi

# Generate migration
echo "Generating migration..."
npx drizzle-kit generate:${this.config.database.provider}

# Run migration
echo "Running migration..."
npx drizzle-kit push:${this.config.database.provider}

echo "✅ Initial migration completed!"
`;

    const migrationPath = join(this.config.output.migrations, 'init.sh');
    await fs.writeFile(migrationPath, migrationScript, 'utf-8');
    
    // Rendre le script exécutable
    await fs.chmod(migrationPath, '755');
  }
}
