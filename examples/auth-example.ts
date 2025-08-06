import { ArvoxFramework } from '../src';
import { AuthModuleFactory, DrizzleAuthGenerator } from '../src/auth';
import type { AuthConfig, DrizzleGeneratorConfig } from '../src/types/auth.type';

// Configuration d'exemple pour une application avec Better Auth + Drizzle
async function createAuthenticatedApp() {
  console.log('🚀 Creating app with Better Auth + Drizzle integration...');

  // 1. Configuration de l'authentification
  const authConfig: AuthConfig = {
    secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    
    database: {
      provider: 'postgresql', // ou 'mysql', 'sqlite'
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },

    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 jours
      updateAge: 60 * 60 * 24, // 1 jour
    },
  };

  // 2. Configuration pour la génération du schéma Drizzle
  const drizzleConfig: DrizzleGeneratorConfig = {
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
    },
    output: {
      schema: './src/db/schema.ts',
      migrations: './drizzle',
      client: './src/db/index.ts',
    },
  };

  // 3. Générer automatiquement le schéma Drizzle (une seule fois)
  if (process.env.GENERATE_SCHEMA === 'true') {
    const generator = new DrizzleAuthGenerator(drizzleConfig);
    await generator.generateSchema();
    return;
  }

  // 4. Simuler l'importation du client de base de données
  // Dans un vrai projet, vous importeriez votre client Drizzle
  const mockDb = {} as any; // Remplacez par votre vraie instance Drizzle

  // 5. Créer le module d'authentification
  const authModule = AuthModuleFactory.create({
    auth: authConfig,
    db: mockDb,
  });

  // 6. Configuration du framework
  const framework = new ArvoxFramework({
    appName: 'My Authenticated API',
    version: '1.0.0',
    description: 'API avec authentification Better Auth + Drizzle',
    port: 3000,
    environment: 'development',
    
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
    },
    
    logging: {
      requests: true,
      errors: true,
    },
    
    apiReference: {
      pageTitle: 'Authenticated API Documentation',
      theme: 'deepSpace',
      darkMode: true,
    },
  });

  // 7. Enregistrer le module d'authentification
  framework.registerModule(authModule.module);
  framework.registerService(authModule.authService);

  // 8. Ajouter un exemple de route protégée
  const app = framework.getApp();
  
  // Route publique
  app.get('/api/v1/public', (c) => {
    return c.json({
      success: true,
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString(),
    });
  });

  // Route protégée avec middleware d'authentification
  app.get('/api/v1/protected', authModule.middleware.required, (c:any) => {
    const user = c.get('user');
    const session = c.get('session');
    
    return c.json({
      success: true,
      message: 'This is a protected endpoint',
      user: user,
      session: session,
      timestamp: new Date().toISOString(),
    });
  });

  // Route avec authentification optionnelle
  app.get('/api/v1/optional', authModule.middleware.optional, (c:any) => {
    const user = c.get('user');
    
    return c.json({
      success: true,
      message: user ? 'Hello authenticated user!' : 'Hello anonymous user!',
      user: user || null,
      timestamp: new Date().toISOString(),
    });
  });

  // 9. Démarrer le serveur
  await framework.start();

  console.log('\n✅ Server started with authentication!');
  console.log('\n📚 Available endpoints:');
  console.log('   Public:');
  console.log('   • GET  /api/v1/public');
  console.log('   • GET  /api/v1/optional');
  console.log('');
  console.log('   Authentication:');
  console.log('   • POST /api/v1/auth/sign-up/email');
  console.log('   • POST /api/v1/auth/sign-in/email');
  console.log('   • POST /api/v1/auth/sign-out');
  console.log('   • GET  /api/v1/auth/session');
  console.log('   • GET  /api/v1/auth/me');
  console.log('');
  console.log('   Protected:');
  console.log('   • GET  /api/v1/protected (requires auth)');
  console.log('');
  console.log('   Documentation:');
  console.log('   • GET  /docs (API documentation)');
  console.log('   • GET  /swagger (OpenAPI spec)');
  console.log('');
  console.log('🔧 Test authentication:');
  console.log('   1. Sign up: POST /api/v1/auth/sign-up/email');
  console.log('      Body: { "email": "test@example.com", "password": "password123", "name": "Test User" }');
  console.log('');
  console.log('   2. Sign in: POST /api/v1/auth/sign-in/email');
  console.log('      Body: { "email": "test@example.com", "password": "password123" }');
  console.log('');
  console.log('   3. Access protected route with session cookie');
}

// Fonction pour générer le schéma seulement
async function generateSchemaOnly() {
  console.log('📋 Generating Drizzle schema for Better Auth...');
  
  const drizzleConfig: DrizzleGeneratorConfig = {
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
    },
    output: {
      schema: './src/db/schema.ts',
      migrations: './drizzle',
      client: './src/db/index.ts',
    },
  };

  const generator = new DrizzleAuthGenerator(drizzleConfig);
  await generator.generateSchema();
  
  console.log('\n✅ Schema generated! Next steps:');
  console.log('   1. Install dependencies: npm install drizzle-orm better-auth @better-auth/cli');
  console.log('   2. Set environment variables in .env:');
  console.log('      BETTER_AUTH_SECRET=your-secret-key');
  console.log('      BETTER_AUTH_URL=http://localhost:3000');
  console.log('      DATABASE_URL=your-database-url');
  console.log('   3. Run migrations: npm run db:push');
  console.log('   4. Start your app normally');
}

// Exporter les fonctions
export { createAuthenticatedApp, generateSchemaOnly };

// Exécuter selon l'argument de ligne de commande
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'generate') {
    generateSchemaOnly().catch(console.error);
  } else {
    createAuthenticatedApp().catch(console.error);
  }
}
