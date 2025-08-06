import { promises as fs } from 'fs';
import { join } from 'path';
import process from 'node:process';

// 'console' is a global object in Node.js, no import needed.
// If you use a linter and get "'console' is not defined", ensure your linter is configured for Node.js environment.

/**
 * Générateur de schéma Drizzle pour Better Auth
 * Crée automatiquement les tables et migrations nécessaires
 */
class DrizzleAuthGenerator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Génère le schéma Drizzle complet pour Better Auth
   */
  async generateSchema() {
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

  async ensureDirectories() {
    const dirs = [
      this.getDirectory(this.config.output.schema),
      this.config.output.migrations,
      this.getDirectory(this.config.output.client),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  getDirectory(filePath) {
    return filePath.substring(0, filePath.lastIndexOf('/'));
  }

  async generateMainSchema() {
    const schemaContent = this.getSchemaContent();
    await fs.writeFile(this.config.output.schema, schemaContent, 'utf-8');
  }

  getSchemaContent() {
    const { provider } = this.config.database;
    const imports = this.getImports(provider);
    const tables = this.getTableDefinitions(provider);
    const relations = this.getRelations();

    return `${imports}

${tables}

${relations}
`;
  }

  getImports(provider) {
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

  getTableDefinitions(provider) {
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

  getPostgreSQLTables() {
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

  getMySQLTables() {
    return `// Users table
export const users = table('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  firstname: varchar('firstname', { length: 255 }),
  lastname: varchar('lastname', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  lastLoginAt: timestamp('last_login_at'),
  emailVerified: boolean('email_verified').notNull(),
  image: varchar('image', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Sessions table
export const sessions = table('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: varchar('impersonated_by', { length: 36 }).references(() => users.id)
});

// Accounts table
export const accounts = table('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: varchar('scope', { length: 255 }),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Verifications table
export const verifications = table('verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});`;
  }

  getSQLiteTables() {
    return `// Users table
export const users = table('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  email: text('email').notNull().unique(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  emailVerified: integer('email_verified'),
  image: text('image'),
  role: text('role').notNull(),
  isAdmin: integer('is_admin'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Sessions table
export const sessions = table('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by').references(() => users.id)
});

// Accounts table
export const accounts = table('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Verifications table
export const verifications = table('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});`;
  }

  getRelations() {
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

  async generateDatabaseClient() {
    const clientContent = this.getDatabaseClientContent();
    await fs.writeFile(this.config.output.client, clientContent, 'utf-8');
  }

  getDatabaseClientContent() {
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

  async generateDrizzleConfig() {
    const configContent = this.getDrizzleConfigContent();
    const configPath = join(process.cwd(), 'drizzle.config.ts');
    await fs.writeFile(configPath, configContent, 'utf-8');
  }

  getDrizzleConfigContent() {
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

  async generateInitialMigration() {
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

export { DrizzleAuthGenerator };
