# Arvox CLI Tools

Collection d'outils CLI pour le framework Arvox backend.

## 🛠️ CLI disponibles

### 📦 `create-arvox-app` - Générateur de projets
### 🔐 `arvox-auth` - Générateur d'authentification

---

## 📦 create-arvox-app

CLI pour générer une application basée sur le framework Arvox.

### Commandes principales

#### Initialiser un projet

```bash
npx create-arvox-app init <nom-du-projet> [options]
```

Ou, si installé globalement :

```bash
create-arvox-app init <nom-du-projet> [options]
```

#### Options
- `-p, --package-manager <pm>` : Gestionnaire de paquets à utiliser (`npm`, `bun`, `pnpm`). Par défaut : `npm`.
- `--help` : Affiche l'aide de la CLI.

#### Exemple
```bash
npx create-arvox-app init mon-api -p pnpm
```

### Ce que fait la CLI

- Crée un dossier `<nom-du-projet>` avec la structure suivante :
	- `package.json` (préconfiguré pour arvox-backend)
	- `tsconfig.json` (TypeScript strict, outDir `dist`)
	- `src/index.ts` (point d'entrée, serveur prêt à l'emploi)
	- `src/controllers/health.controller.ts` (contrôleur de santé)
	- `README.md` (instructions de démarrage)
- Installe automatiquement les dépendances et devDependencies nécessaires
- Affiche les prochaines étapes pour démarrer le projet

### Scripts générés
- `dev` : Démarre le serveur en mode développement (hot reload)
- `build` : Compile le projet TypeScript
- `start` : Lance le serveur compilé

### API par défaut
- `GET /health` : Vérifie l'état du serveur
- `GET /doc` : Documentation OpenAPI (si activée dans le projet)

---

## 🔐 arvox-auth

CLI pour générer une solution d'authentification complète avec Better Auth + Drizzle ORM.

### Commandes principales

#### Génération complète
```bash
npx arvox-auth generate [options]
```

#### Options principales
- `--provider <type>` : Base de données (`postgresql`, `mysql`, `sqlite`) - Défaut: `postgresql`
- `--output <path>` : Dossier de sortie - Défaut: `./db`
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
npx arvox-auth schema --provider postgresql --output ./db
```

#### Configuration seulement
```bash
npx arvox-auth config --social github,google --output ./db
```

#### Validation
```bash
npx arvox-auth validate
```

### Fichiers générés

```
db/
├── schema.ts              # Schéma Drizzle (users, sessions, accounts, verifications)
├── index.ts               # Client de base de données
├── auth.config.ts         # Configuration Better Auth
├── integration-example.ts # Exemple d'intégration
├── migrations/            # Dossier migrations
│   └── init.sh           # Script d'initialisation
└── drizzle.config.ts      # Config Drizzle Kit (racine)

.env.example               # Variables d'environnement
```

### Schéma généré

Le CLI génère 4 tables optimisées pour Better Auth :

- **`users`** : Utilisateurs avec champs étendus (firstname, lastname, role, isAdmin, etc.)
- **`sessions`** : Sessions avec support d'impersonation
- **`accounts`** : Comptes pour providers sociaux (OAuth)
- **`verifications`** : Tokens de vérification email/reset password

### Intégration dans Arvox

```typescript
import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
import { db } from './db';
import { authConfig } from './db/auth.config';

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

### Projet complet avec authentification

```bash
# 1. Créer le projet
npx create-arvox-app init mon-api-auth
cd mon-api-auth

# 2. Générer l'authentification
npx arvox-auth generate --social github,google

# 3. Installer les dépendances auth
npm install better-auth drizzle-orm postgres

# 4. Configurer les variables
cp .env.example .env
# Éditer .env avec vos vraies valeurs

# 5. Migrations et démarrage
npx drizzle-kit generate
npx drizzle-kit push
npm run dev

# 6. Tester
curl http://localhost:3000/api/v1/auth/me
curl http://localhost:3000/docs
```

## 📚 Documentation complète

- **CLI create-arvox-app** : Documentation dans ce fichier
- **CLI arvox-auth** : [docs/arvox-auth-cli.md](../docs/arvox-auth-cli.md)
- **Framework général** : [README.md](../README.md)

## Auteur
Arvox

## Licence
MIT
