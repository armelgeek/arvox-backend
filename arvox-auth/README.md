
# arvox-auth

> **Note** : Depuis août 2025, le CLI `arvox-auth` fonctionne en pur JavaScript (ES2022), sans dépendance TypeScript pour l'exécution. Assurez-vous d'utiliser Node.js v18+.

CLI pour générer une solution d'authentification complète avec Better Auth + Drizzle ORM.

### ⚡️ Nouveauté : Pure JavaScript
Le générateur et le CLI sont désormais en JavaScript natif. Vous n'avez plus besoin de compiler TypeScript pour utiliser la CLI.

**Prérequis** : Node.js v18 ou supérieur

### Commandes principales

#### Génération complète
```bash
npx arvox-auth generate [options]
```

#### Options principales
- `--provider <type>` : Base de données (`postgresql`, `mysql`, `sqlite`) - Défaut: `postgresql`
- `--output <path>` : Dossier de sortie - Défaut: `./src/db`
- `--auth-url <url>` : URL de base - Défaut: `http://localhost:3000`
- `--social <providers>` : Providers sociaux (ex: `github,google,discord`)

#### Exemples
```bash
# Génération basique PostgreSQL
npx arvox-auth generate

# Avec providers sociaux
npx arvox-auth generate --social github,google

# MySQL avec URL personnalisée
npx arvox-auth generate --provider mysql --auth-url https://monapi.com

# Dossier personnalisé
npx arvox-auth generate --output ./custom-db
```

### Commandes spécialisées

#### Schéma seulement
```bash
npx arvox-auth schema --provider postgresql --output ./src/db
```

#### Configuration seulement
```bash
npx arvox-auth config --social github,google --output ./src/db
```

#### Validation
```bash
npx arvox-auth validate
```


### Fichiers générés automatiquement

```
db/
├── schema.ts              # Schéma Drizzle harmonisé (users, sessions, accounts, verifications)
├── index.ts               # Client de base de données
├── auth.config.ts         # Configuration Better Auth
├── integration-example.ts # Exemple d'intégration
├── migrations/            # Dossier migrations
│   └── init.sh           # Script d'initialisation
└── drizzle.config.ts      # Config Drizzle Kit (racine)

.env.example               # Variables d'environnement (format prêt à l'emploi)
prettier.config.js         # Configuration Prettier
eslint.config.js           # Configuration ESLint
package.json               # Scripts & hooks git auto-ajoutés
```

> **Astuce** : Les fichiers de configuration et scripts sont adaptés au gestionnaire de paquets choisi (`npm`, `pnpm`, `bun`).

> **Note technique** : Le schéma Drizzle est harmonisé pour PostgreSQL, MySQL et SQLite (noms de tables et champs identiques).

> **.env.example** : Généré avec toutes les variables nécessaires, y compris les clés pour providers sociaux. Format compatible linter, prêt à copier dans `.env`.

> **Linter/ESLint** : Si vous voyez une erreur sur la ligne du shebang (`#!/usr/bin/env node`), c'est un faux positif. Node.js exécutera le CLI correctement. Configurez ESLint pour ignorer cette ligne dans les fichiers d'entrée CLI si besoin.




### Schéma généré

Le CLI génère 4 tables optimisées et harmonisées pour Better Auth :

- **`users`** : Utilisateurs avec champs étendus (firstname, lastname, role, isAdmin, etc.)
- **`sessions`** : Sessions avec support d'impersonation
- **`accounts`** : Comptes pour providers sociaux (OAuth)
- **`verifications`** : Tokens de vérification email/reset password


### Intégration dans Arvox

```typescript
import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
import { db } from './src/db';
import { authConfig } from './src/db/auth.config';

// Créer le module d'authentification
const authModule = AuthModuleFactory.create({
  auth: authConfig,
  db: db,
});

const framework = new ArvoxFramework({
  appName: 'Mon API avec Auth',
  version: '1.0.0',
  port: 3000,
});

// Enregistrer l'authentification
framework.registerModule(authModule.module);
framework.registerService(authModule.authService);

// Routes protégées
const app = framework.getApp();
app.get('/api/protected', authModule.middleware.required, (c) => {
  const user = c.get('user');
  return c.json({ message: 'Protected endpoint', user });
});

await framework.start();
```

### Endpoints d'authentification automatiques

Une fois intégré, votre API dispose de :

```
POST /api/v1/auth/sign-up/email     # Inscription
POST /api/v1/auth/sign-in/email     # Connexion
GET  /api/v1/auth/me                # Profil utilisateur
POST /api/v1/auth/sign-out          # Déconnexion
GET  /api/v1/auth/session           # Vérifier session

# Avec providers sociaux :
GET  /api/v1/auth/sign-in/github    # GitHub OAuth
GET  /api/v1/auth/sign-in/google    # Google OAuth
```


### Providers sociaux supportés

- `github` - GitHub OAuth
- `google` - Google OAuth
- `discord` - Discord OAuth
- `twitter` - Twitter/X OAuth
- `facebook` - Facebook OAuth


### Support des bases de données

- **PostgreSQL** (défaut) : `postgres`, `drizzle-orm`
- **MySQL** : `mysql2`, `drizzle-orm`
- **SQLite** : `better-sqlite3`, `drizzle-orm`

---


## 🚀 Workflow recommandé

### Exemple de workflow

```bash

# 1. Générer l'authentification et tous les fichiers nécessaires
npx arvox-auth generate --social github,google

# 2. Installer les dépendances auth
npm install better-auth drizzle-orm postgres

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos vraies valeurs (clés OAuth, secrets, etc.)

# 4. Migrations et démarrage
npx drizzle-kit generate
npx drizzle-kit push
npm run dev

# 5. Tester l'API et la documentation
curl http://localhost:3000/api/v1/auth/me
curl http://localhost:3000/docs
```


### 📋 Astuce : Publication npm
Avant de publier, vérifiez que le dossier `dist/` est bien présent et inclus dans le package. Utilisez le champ `files` dans `package.json` :

```json
"files": ["dist", "arvox-auth.js"]
```


## 📚 Documentation complète
- **CLI arvox-auth** : [docs/arvox-auth-cli.md](../docs/arvox-auth-cli.md)
- **Framework général** : [README.md](../README.md)


## Auteur
Arvox

## Licence
MIT
