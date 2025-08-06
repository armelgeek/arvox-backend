# Auth CLI - Générateur d'authentification Arvox

Outil en ligne de commande pour générer et configurer l'authentification Better Auth + Drizzle dans vos projets Arvox.

## Installation

```bash
npm install -g @arvox/auth-cli
# ou
npx @arvox/auth-cli
```

## Utilisation

### Générer un schéma d'authentification complet

```bash
# Génération interactive
arvox-auth init

# Génération avec options
arvox-auth generate --provider postgresql --output ./src/db
```

### Options disponibles

- `--provider`: Type de base de données (`postgresql`, `mysql`, `sqlite`)
- `--output`: Dossier de sortie pour les fichiers générés
- `--auth-url`: URL de base pour l'authentification
- `--social`: Activer les providers sociaux (github,google,discord)

### Exemples

```bash
# PostgreSQL avec GitHub et Google
arvox-auth generate \
  --provider postgresql \
  --output ./src/db \
  --social github,google

# SQLite simple
arvox-auth generate \
  --provider sqlite \
  --output ./database \
  --auth-url http://localhost:3000

# MySQL avec configuration complète
arvox-auth generate \
  --provider mysql \
  --output ./src/database \
  --social github,google,discord \
  --auth-url https://api.myapp.com
```

## Fichiers générés

L'outil génère automatiquement :

- `schema.ts` - Schéma Drizzle avec tables d'authentification
- `index.ts` - Client de base de données configuré
- `drizzle.config.ts` - Configuration Drizzle Kit
- `auth.config.ts` - Configuration Better Auth
- `migrations/` - Migrations initiales
- `.env.example` - Variables d'environnement requises

## Intégration dans votre projet

Après génération, ajoutez dans votre `main.ts` :

```typescript
import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
import { db } from './src/db'; // Généré automatiquement
import { authConfig } from './src/db/auth.config'; // Généré automatiquement

const authModule = AuthModuleFactory.create({
  auth: authConfig,
  db: db,
});

const framework = new ArvoxFramework({
  // ... votre config
});

framework.registerModule(authModule.module);
framework.registerService(authModule.authService);

await framework.start();
```

## Variables d'environnement requises

```bash
# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Providers sociaux (optionnel)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Commandes additionnelles

```bash
# Générer seulement le schéma
arvox-auth schema --provider postgresql

# Générer seulement la config
arvox-auth config --social github,google

# Mettre à jour un projet existant
arvox-auth update

# Vérifier la configuration
arvox-auth validate
```
