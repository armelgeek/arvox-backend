import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
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
  
  console.log('\n✅ Server started with authentication!');
  console.log('📚 Endpoints:');
  console.log('   • POST /api/v1/auth/sign-up/email');
  console.log('   • POST /api/v1/auth/sign-in/email');
  console.log('   • GET  /api/v1/auth/me');
  console.log('   • GET  /api/protected (requires auth)');
  console.log('   • GET  /docs (API documentation)');
}

export { createAppWithAuth };

// Exécuter si ce fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createAppWithAuth().catch(console.error);
}