# CLI arvox-auth - Générateur d'authentification

Le CLI `arvox-auth` génère automatiquement une solution d'authentification complète utilisant **Better Auth** et **Drizzle ORM** pour les applications Arvox.

## 🚀 Installation et utilisation

```bash
# Via NPX (recommandé)
npx arvox-auth generate --social github,google

# Ou après installation globale
npm install -g arvox-backend
arvox-auth generate --social github,google
```

## 📋 Commandes disponibles

### `generate` - Génération complète

Génère tous les fichiers nécessaires pour l'authentification.

```bash
arvox-auth generate [options]
```

**Options :**
- `--provider <type>` : Type de base de données (`postgresql`, `mysql`, `sqlite`) - Défaut: `postgresql`
- `--output <path>` : Dossier de sortie - Défaut: `./db`
- `--auth-url <url>` : URL de base pour l'authentification - Défaut: `http://localhost:3000`
- `--social <providers>` : Providers sociaux séparés par des virgules - Défaut: aucun

**Exemples :**
```bash
# Génération basique PostgreSQL
arvox-auth generate

# Avec providers sociaux
arvox-auth generate --social github,google,discord

# MySQL avec URL personnalisée
arvox-auth generate --provider mysql --auth-url https://monapi.com

# Dossier de sortie personnalisé
arvox-auth generate --output ./custom-db
```

### `schema` - Schéma Drizzle seulement

Génère uniquement le schéma Drizzle sans configuration.

```bash
arvox-auth schema [options]
```

**Options :**
- `--provider <type>` : Type de base de données - Défaut: `postgresql`
- `--output <path>` : Dossier de sortie - Défaut: `./db`

**Exemple :**
```bash
arvox-auth schema --provider mysql --output ./database
```

### `config` - Configuration seulement

Génère uniquement les fichiers de configuration Better Auth.

```bash
arvox-auth config [options]
```

**Options :**
- `--social <providers>` : Providers sociaux - Défaut: aucun
- `--output <path>` : Dossier de sortie - Défaut: `./db`

**Exemple :**
```bash
arvox-auth config --social github,google --output ./auth
```

### `validate` - Validation

Valide une configuration d'authentification existante.

```bash
arvox-auth validate
```

Vérifie la présence des fichiers requis :
- `./db/schema.ts`
- `./db/index.ts`
- `./.env`

### `init` - Interface interactive

*À venir dans une prochaine version*

Interface interactive pour configurer l'authentification étape par étape.

## 📁 Structure générée

Après exécution de `arvox-auth generate`, vous obtenez :

```
db/
├── schema.ts              # Schéma Drizzle avec tables users, sessions, accounts, verifications
├── index.ts               # Client de base de données configuré
├── auth.config.ts         # Configuration Better Auth
├── integration-example.ts # Exemple d'intégration dans votre app Arvox
├── migrations/            # Dossier pour les migrations Drizzle
│   └── init.sh           # Script d'initialisation des migrations
└── drizzle.config.ts      # Configuration Drizzle Kit (racine du projet)

.env.example               # Variables d'environnement d'exemple
```

## 🗄️ Schéma de base de données

Le CLI génère un schéma Drizzle optimisé pour Better Auth avec 4 tables :

### Table `users`
```typescript
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
```

### Table `sessions`
```typescript
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  impersonatedBy: text('impersonated_by').references(() => users.id),
  // ... autres champs (IP, user agent, timestamps)
});
```

### Table `accounts` (pour providers sociaux)
```typescript
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  // ... autres champs OAuth
});
```

### Table `verifications` (pour email, reset password)
```typescript
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  // ... timestamps
});
```

## ⚙️ Configuration Better Auth

Le fichier `auth.config.ts` généré inclut :

```typescript
export const authConfig: AuthConfig = {
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  
  database: {
    provider: 'postgresql',
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // Providers sociaux si configurés
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    // ...
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24,     // 1 jour
  },
};
```

## 🌐 Providers sociaux supportés

Le CLI supporte les providers suivants via l'option `--social` :

- `github` - GitHub OAuth
- `google` - Google OAuth
- `discord` - Discord OAuth
- `twitter` - Twitter/X OAuth
- `facebook` - Facebook OAuth

**Exemple avec multiple providers :**
```bash
arvox-auth generate --social github,google,discord
```

## 🔐 Variables d'environnement

Le fichier `.env.example` généré contient :

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here-32-chars-min
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration  
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Social Providers (si configurés)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🔗 Intégration dans Arvox

Le fichier `integration-example.ts` montre comment intégrer l'authentification :

```typescript
import { ArvoxFramework, AuthModuleFactory } from 'arvox-backend';
import { db } from './index';
import { authConfig } from './auth.config';

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
  });

  // Enregistrer le module d'authentification
  framework.registerModule(authModule.module);
  framework.registerService(authModule.authService);

  // Routes protégées
  const app = framework.getApp();
  app.get('/api/protected', authModule.middleware.required, (c) => {
    const user = c.get('user');
    return c.json({ message: 'Protected endpoint', user });
  });

  await framework.start();
}
```

## 🚀 Workflow de déploiement

### 1. Génération
```bash
npx arvox-auth generate --social github,google
```

### 2. Installation des dépendances
```bash
npm install better-auth drizzle-orm postgres  # ou mysql2, better-sqlite3
npm install -D drizzle-kit
```

### 3. Configuration
```bash
cp .env.example .env
# Éditer .env avec vos vraies valeurs
```

### 4. Migrations
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 5. Intégration
Copiez le code de `integration-example.ts` dans votre application principale.

### 6. Test
```bash
npm run dev
curl http://localhost:3000/api/v1/auth/me
```

## 🛠️ Support des bases de données

### PostgreSQL (défaut)
```bash
arvox-auth generate --provider postgresql
```
**Dépendances :** `postgres`, `drizzle-orm`

### MySQL
```bash
arvox-auth generate --provider mysql
```
**Dépendances :** `mysql2`, `drizzle-orm`

### SQLite
```bash
arvox-auth generate --provider sqlite
```
**Dépendances :** `better-sqlite3`, `drizzle-orm`

## ❗ Troubleshooting

### Erreur : "Module not found"
Assurez-vous que le framework est compilé :
```bash
npm run build
```

### Erreur : "Invalid provider"
Vérifiez que le provider est supporté : `postgresql`, `mysql`, `sqlite`.

### Erreur de validation
Utilisez `arvox-auth validate` pour diagnostiquer les fichiers manquants.

### Tables déjà existantes
Supprimez les tables existantes ou utilisez un nom de base de données différent.

## 🔄 Mise à jour

Pour mettre à jour le schéma d'authentification :

1. Sauvegardez vos données
2. Régénérez avec `arvox-auth generate`
3. Appliquez les nouvelles migrations
4. Testez l'intégration

## 📞 Support

Pour les problèmes spécifiques au CLI `arvox-auth` :
1. Vérifiez cette documentation
2. Utilisez `arvox-auth validate`
3. Consultez les logs d'erreur
4. Ouvrez une issue sur GitHub
