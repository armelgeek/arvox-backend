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
  .action(async (projectName, options) => {
    await createProject(projectName, options.packageManager);
  });

async function createProject(projectName, packageManager) {
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
    
    console.log(`✅ Projet ${projectName} créé avec succès !`);
    console.log('\n📋 Prochaines étapes :');
    console.log(`   cd ${projectName}`);
    console.log(`   ${packageManager} run dev`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du projet :', error.message);
    process.exit(1);
  }
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
