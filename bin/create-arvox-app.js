#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('create-arvox-app')
  .description('CLI pour créer des projets avec arvox-backend')
  .version('1.0.0');

program
  .command('init <project-name>')
  .description('Créer un nouveau projet')
  .option('-p, --package-manager <pm>', 'Package manager à utiliser (npm, bun, pnpm)', 'npm')
  .option('--with-auth', 'Générer la configuration auth Better Auth + Drizzle')
  .action(async (projectName, options) => {
    await createProject(projectName, options.packageManager, options.withAuth);
  });

async function createProject(projectName, packageManager, withAuth) {
  console.log(`🚀 Création du projet ${projectName}...`);

  const projectDir = path.join(process.cwd(), projectName);

  try {
    // Créer le répertoire du projet
    await fs.mkdir(projectDir, { recursive: true });

    // Générer les fichiers du template
    await generateBasicTemplate(projectDir, projectName);

    console.log(`📦 Installation des dépendances avec ${packageManager}...`);

    // Installer les dépendances
    await installDependencies(projectDir, packageManager);


    // Générer l'authentification si demandé (intégré, plus de dépendance arvox-auth)
    if (withAuth) {
      console.log('🔑 Génération de la configuration auth (Better Auth + Drizzle)...');
      await generateAuthFiles(projectDir);
    }

    console.log(`✅ Projet ${projectName} créé avec succès !`);
    console.log('\n📋 Prochaines étapes :');
    console.log(`   cd ${projectName}`);
    console.log(`   ${packageManager} run dev`);

  } catch (error) {
    console.error('❌ Erreur lors de la création du projet :', error.message);
    process.exit(1);
  }
}

// Génère tous les fichiers nécessaires pour Better Auth + Drizzle
async function generateAuthFiles(projectDir) {
  const join = path.join;
  const dbDir = join(projectDir, 'src', 'infrastructure', 'database');
  const configDir = join(projectDir, 'src', 'infrastructure', 'config');

  // 1. Générer un schema Drizzle minimal
  const schemaTs = `import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'),
  firstname: text('firstname'),
  lastname: text('lastname'),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull()
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull()
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull()
});
`;
  await fs.mkdir(dbDir, { recursive: true });
  await fs.writeFile(join(dbDir, 'schema.ts'), schemaTs, 'utf-8');

  // 2. Générer un client db minimal
  const dbTs = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
`;
  await fs.writeFile(join(dbDir, 'db.ts'), dbTs, 'utf-8');

  // 3. Générer le template minimal Better Auth config
  const authConfigTs = `import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../database/db';
import { users } from '../database/schema';

// Remplacez ceci par votre propre fonction d'envoi d'email OTP
async function sendOTPEmail(params) {
  // params: { email, otp }
  // TODO: Intégrez votre service d'email ici
}

export const auth = betterAuth({
  plugins: [
    emailOTP({
      expiresIn: 300, // 5 minutes
      otpLength: 6,
      async sendVerificationOTP({ email, otp }) {
        await sendOTPEmail({ email, otp });
      }
    })
  ],
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    process.env.REACT_APP_URL || 'http://localhost:5173'
  ],
  user: {
    modelName: 'users',
    additionalFields: {
      firstname: { type: 'string', default: '', returned: true },
      lastname: { type: 'string', default: '', returned: true },
      isAdmin: { type: 'boolean', default: false, returned: true }
    }
  },
  session: {
    modelName: 'sessions'
  },
  account: {
    modelName: 'accounts'
  },
  verification: {
    modelName: 'verifications'
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false
  }
});

// Router Better Auth avec update lastLoginAt
const router = new Hono({ strict: false });

router.on(['POST', 'GET'], '/auth/*', async (c) => {
  const path = c.req.path;
  const response = await auth.handler(c.req.raw);

  if (
    c.req.method === 'POST' &&
    (path === '/api/auth/sign-in/email' || path === '/api/auth/sign-in/email-otp')
  ) {
    try {
      const body = await response.text();
      const data = JSON.parse(body);

      if (data?.user?.id) {
        const now = new Date();
        await db
          .update(users)
          .set({
            lastLoginAt: now,
            updatedAt: now
          })
          .where(eq(users.id, data.user.id))
          .returning({ lastLoginAt: users.lastLoginAt });
      }

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      console.error('Failed to update last login date:', error);
    }
  }

  return response;
});

export default router;
`;
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(join(configDir, 'auth.config.ts'), authConfigTs, 'utf-8');

  // 4. Générer un .env.example
  const envExample = `DATABASE_URL=postgresql://postgres:password@localhost:5432/default_db?search_path=public
BETTER_AUTH_SECRET=ZAyWnPtauC0eytcpaueedNSvosqAVdDe
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV="development"
REACT_APP_URL=http://localhost:5173
`;
  await fs.writeFile(join(projectDir, '.env.example'), envExample, 'utf-8');

  console.log('✅ Auth (Better Auth + Drizzle) généré dans le projet.');
}

async function generateBasicTemplate(projectDir, projectName) {
  // package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'API créée avec arvox-backend',
    main: 'dist/index.js',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      },
    dependencies: {
      'arvox-backend': '^1.0.5',
      '@hono/node-server': '^1.8.2',
      'drizzle-orm': '^0.43.1',
      'dotenv': '^16.5.0',
      "better-auth": "^1.2.7",
      'hono': '^4.7.5',
      'postgres': '^3.4.5',
    },
    devDependencies: {
      '@commitlint/cli': '^19.8.0',
      '@commitlint/config-conventional': '^19.8.0',
      '@kolhe/eslint-config': '2.2.6',
      '@types/node': '^20.0.0',
      'tsx': '^4.0.0',
      'typescript': '^5.0.0',
      'drizzle-kit': '^0.31.1',
      'tsc-alias': '^1.8.13',
      'prettier': '^3.5.3',
      'eslint': '^9.23.0',
      'simple-git-hooks': '^2.12.1',
      'eslint-plugin-prettier': '^5.2.5',
    }
  };

  await fs.writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };

  await fs.writeFile(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Créer le dossier src, controllers, modules
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
   await fs.mkdir(path.join(projectDir, 'src', 'application', 'services'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'application', 'use-cases'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'domain', 'models'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'domain', 'repositories'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'domain', 'types'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'config'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'controllers'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'database'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'middlewares'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'repositories'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src', 'infrastructure', 'modules'), { recursive: true });

  // index.ts principal
  const indexTs = `import { serve } from '@hono/node-server';
import { ArvoxFramework } from 'arvox-backend';
import { HealthModule } from './infrastructure/modules/health.module';
import {}

const app = new ArvoxFramework({
  appName: '${projectName} API',
  version: '1.0.0',
  description: 'API créée avec arvox-backend'
});

// Enregistrer le module Health
app.registerModule(new HealthModule());
app.start();
`;
  await fs.writeFile(path.join(projectDir, 'src', 'index.ts'), indexTs);

  // HealthController
  const healthController = `import { BaseController } from 'arvox-backend';
import { z } from 'zod';

export class HealthController extends BaseController {
  initRoutes() {
    this.createListRoute(
      '/health',
      {
        response: z.object({
          status: z.string(),
          timestamp: z.string(),
          uptime: z.number()
        }),
        tag: 'Health',
        summary: "Vérification de l'état du serveur",
        description: 'Retourne le statut de santé du serveur'
      },
      async (c) => {
        return c.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          }
        });
      }
    );
  }
}
`;
  await fs.writeFile(
    path.join(projectDir, 'src', 'infrastructure', 'controllers', 'health.controller.ts'),
    healthController
  );

  // HealthModule
  const healthModule = `import { IModule } from 'arvox-backend';
import { HealthController } from '../controllers/health.controller';

export class HealthModule implements IModule {
  private controller: HealthController;

  constructor() {
    this.controller = new HealthController();
  }

  getName() {
    return 'health';
  }

  async initialize() {
    // Initialisation éventuelle
  }

  registerRoutes(app:any) {
    app.route('/health', this.controller.controller);
  }

  async cleanup() {
    // Nettoyage éventuel
  }

  async healthCheck() {
    return { healthy: true };
  }
}
`;
  await fs.writeFile(
    path.join(projectDir, 'src', 'infrastructure', 'modules', 'health.module.ts'),
    healthModule
  );

  // README.md
  const readme = `# ${projectName}

API créée avec [arvox-backend](https://github.com/armelgeek/arvox-backend).

## Démarrage rapide

\`\`\`bash
npm run dev
\`\`\`

L'API sera disponible sur http://localhost:3000

## Documentation

- Health check : GET /health
- Documentation OpenAPI : GET /doc

## Scripts

- \`npm run dev\` : Démarrer en mode développement
- \`npm run build\` : Compiler le projet
- \`npm run start\` : Démarrer en mode production
`;
  await fs.writeFile(path.join(projectDir, 'README.md'), readme);
}

function installDependencies(projectDir, packageManager) {
  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, ['install'], {
      cwd: projectDir,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${packageManager} install failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

program.parse();
