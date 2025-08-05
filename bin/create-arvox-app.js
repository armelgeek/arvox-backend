#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('create-arvox-app')
  .description('CLI pour créer des projets avec @arvox/backend-framework')
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
    description: 'API créée avec @arvox/backend-framework',
    main: 'dist/index.js',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js'
    },
    dependencies: {
      '@arvox/backend-framework': '^1.0.0',
      '@hono/node-server': '^1.8.2'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      'tsx': '^4.0.0',
      'typescript': '^5.0.0'
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
  
  // Créer le dossier src
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  
  // index.ts principal
  const indexTs = `import { serve } from '@hono/node-server';
import { ArvoxFramework } from '@arvox/backend-framework';
import { HealthController } from './controllers/health.controller';

const app = new ArvoxFramework({
  title: '${projectName} API',
  version: '1.0.0',
  description: 'API créée avec @arvox/backend-framework'
});

// Enregistrer les contrôleurs
app.registerController(new HealthController());

// Démarrer le serveur
const port = 3000;
console.log('🚀 Serveur démarré sur http://localhost:' + port);

serve({
  fetch: app.fetch,
  port
});
`;
  
  await fs.writeFile(path.join(projectDir, 'src', 'index.ts'), indexTs);
  
  // Créer le dossier controllers
  await fs.mkdir(path.join(projectDir, 'src', 'controllers'), { recursive: true });
  
  // HealthController
  const healthController = `import { BaseController } from '@arvox/backend-framework';
import { z } from 'zod';

export class HealthController extends BaseController {
  constructor() {
    super();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.createGetRoute('/health', {
      summary: 'Vérification de l\\'état du serveur',
      responses: {
        200: {
          description: 'Serveur en bonne santé',
          content: {
            'application/json': {
              schema: z.object({
                status: z.string(),
                timestamp: z.string(),
                uptime: z.number()
              })
            }
          }
        }
      }
    }, async (c) => {
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
  }
}
`;
  
  await fs.writeFile(
    path.join(projectDir, 'src', 'controllers', 'health.controller.ts'),
    healthController
  );
  
  // README.md
  const readme = `# ${projectName}

API créée avec [@arvox/backend-framework](https://github.com/arvox/backend-framework).

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
