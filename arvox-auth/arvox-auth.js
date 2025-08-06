#!/usr/bin/env node

import { Command } from 'commander';
import { DrizzleAuthGenerator } from './drizzle-generator.js';
import { promises as fs } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('arvox-auth')
  .description('Générateur d\'authentification Better Auth + Drizzle pour Arvox')
  .version('1.0.0');

// Commande init (interactive)
program
  .command('init')
  .description('Initialisation interactive de l\'authentification')
  .action(async () => {
    console.log('🚀 Initialisation de l\'authentification Arvox...');
    
    // TODO: Ajouter l'interface interactive avec inquirer
    console.log('Interface interactive à venir...');
    console.log('Utilisez "arvox-auth generate" avec les options pour le moment.');
  });

// Commande generate
program
  .command('generate')
  .description('Générer les fichiers d\'authentification')
  .option('--provider <type>', 'Type de base de données (postgresql, mysql, sqlite)', 'postgresql')
  .option('--output <path>', 'Dossier de sortie', './db')
  .option('--auth-url <url>', 'URL de base pour l\'authentification', 'http://localhost:3000')
  .option('--social <providers>', 'Providers sociaux (github,google,discord)', '')
  .action(async (options) => {
    try {
      console.log('🔄 Génération des fichiers d\'authentification...');
      
      const config = {
        database: {
          provider: options.provider,
          url: `${options.provider}://user:password@localhost:5432/myapp`,
        },
        output: {
          schema: join(options.output, 'schema.ts'),
          migrations: join(options.output, 'migrations'),
          client: join(options.output, 'index.ts'),
        },
      };

      const generator = new DrizzleAuthGenerator(config);
      await generator.generateSchema();

      // Générer la configuration Better Auth
      await generateAuthConfig(options.output, options.authUrl, options.social);

      // Générer l'exemple d'intégration
      await generateIntegrationExample(options.output);

      // Générer le fichier .env.example
      await generateEnvExample(options.social);

      console.log('✅ Génération terminée avec succès !');
      console.log('\n📋 Prochaines étapes :');
      console.log('1. Installez les dépendances : npm install better-auth drizzle-orm');
      console.log('2. Configurez vos variables d\'environnement (.env)');
      console.log('3. Exécutez les migrations : npm run db:push');
      console.log('4. Intégrez dans votre projet (voir integration-example.ts)');
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération :', error);
      process.exit(1);
    }
  });

// Commande schema
program
  .command('schema')
  .description('Générer seulement le schéma Drizzle')
  .option('--provider <type>', 'Type de base de données', 'postgresql')
  .option('--output <path>', 'Dossier de sortie', './db')
  .action(async (options) => {
    try {
      const config = {
        database: {
          provider: options.provider,
          url: `${options.provider}://user:password@localhost:5432/myapp`,
        },
        output: {
          schema: join(options.output, 'schema.ts'),
          migrations: join(options.output, 'migrations'),
          client: join(options.output, 'index.ts'),
        },
      };

      const generator = new DrizzleAuthGenerator(config);
      await generator.generateSchema();
      console.log('✅ Schéma généré avec succès !');
    } catch (error) {
      console.error('❌ Erreur :', error);
      process.exit(1);
    }
  });

// Commande config
program
  .command('config')
  .description('Générer seulement la configuration')
  .option('--social <providers>', 'Providers sociaux', '')
  .option('--output <path>', 'Dossier de sortie', './db')
  .action(async (options) => {
    try {
      await generateAuthConfig(options.output, 'http://localhost:3000', options.social);
      console.log('✅ Configuration générée avec succès !');
    } catch (error) {
      console.error('❌ Erreur :', error);
      process.exit(1);
    }
  });

// Commande validate
program
  .command('validate')
  .description('Valider la configuration existante')
  .action(async () => {
    try {
      console.log('🔍 Validation de la configuration...');
      
      // Vérifier les fichiers requis
      const requiredFiles = [
        './db/schema.ts',
        './db/index.ts',
        './.env',
      ];

      for (const file of requiredFiles) {
        try {
          await fs.access(file);
          console.log(`✅ ${file} trouvé`);
        } catch {
          console.log(`❌ ${file} manquant`);
        }
      }

      console.log('✅ Validation terminée');
    } catch (error) {
      console.error('❌ Erreur :', error);
      process.exit(1);
    }
  });

async function generateAuthConfig(outputPath, authUrl, socialProviders) {
  const socialConfig = parseSocialProviders(socialProviders);
  
  const configContent = `import type { AuthConfig } from 'arvox-backend';

export const authConfig: AuthConfig = {
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here',
  baseURL: process.env.BETTER_AUTH_URL || '${authUrl}',
  trustedOrigins: ['${authUrl}', 'http://localhost:5173'],
  
  database: {
    provider: 'postgresql', // ou 'mysql', 'sqlite'
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  ${socialConfig.length > 0 ? `socialProviders: {
${socialConfig.map(provider => `    ${provider}: {
      clientId: process.env.${provider.toUpperCase()}_CLIENT_ID || '',
      clientSecret: process.env.${provider.toUpperCase()}_CLIENT_SECRET || '',
    },`).join('\n')}
  },` : '// socialProviders: {},'}

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
};`;

  await fs.writeFile(join(outputPath, 'auth.config.ts'), configContent, 'utf-8');
}

async function generateIntegrationExample(outputPath) {
  const exampleContent = `import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
import { db } from './index'; // Client de base de données généré
import { authConfig } from './auth.config'; // Configuration générée

async function createAppWithAuth() {
  // Créer le module d'authentification
  const authModule = AuthModuleFactory.create({
    auth: authConfig,
    db: db,
  });

  // Configuration du framework
  const framework = new ArvoxFramework({
    appName: 'Mon API avec Auth',
    version: '1.0.0',
    port: 3000,
    
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
    },
    
    logging: {
      requests: true,
      errors: true,
    },
  });

  // Enregistrer le module d'authentification
  framework.registerModule(authModule.module);
  framework.registerService(authModule.authService);

  // Ajouter des routes d'exemple
  const app = framework.getApp();
  
  // Route publique
  app.get('/api/public', (c) => {
    return c.json({ message: 'Public endpoint' });
  });

  // Route protégée
  app.get('/api/protected', authModule.middleware.required, (c) => {
    const user = c.get('user');
    return c.json({ message: 'Protected endpoint', user });
  });

  // Démarrer le serveur
  await framework.start();
  
  console.log('\\n✅ Server started with authentication!');
  console.log('📚 Endpoints:');
  console.log('   • POST /api/v1/auth/sign-up/email');
  console.log('   • POST /api/v1/auth/sign-in/email');
  console.log('   • GET  /api/v1/auth/me');
  console.log('   • GET  /api/protected (requires auth)');
  console.log('   • GET  /docs (API documentation)');
}

export { createAppWithAuth };

// Exécuter si ce fichier est lancé directement
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  createAppWithAuth().catch(console.error);
}`;

  await fs.writeFile(join(outputPath, 'integration-example.ts'), exampleContent, 'utf-8');
}

async function generateEnvExample(socialProviders) {
  const socialConfig = parseSocialProviders(socialProviders);
  
  const envContent = `# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here-32-chars-min
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

${socialConfig.length > 0 ? 
`# Social Providers
${socialConfig.map(provider => 
`${provider.toUpperCase()}_CLIENT_ID=your-${provider}-client-id
${provider.toUpperCase()}_CLIENT_SECRET=your-${provider}-client-secret`
).join('\n')}` : 
`# Social Providers (uncomment to enable)
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret`}`;

  await fs.writeFile('.env.example', envContent, 'utf-8');
}

function parseSocialProviders(social) {
  if (!social) return [];
  return social.split(',').map(s => s.trim()).filter(Boolean);
}

program.parse();
