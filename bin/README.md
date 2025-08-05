
# create-arvox-app

CLI pour générer une application basée sur le framework Arvox.

## Commandes principales

### Initialiser un projet

```bash
npx create-arvox-app init <nom-du-projet> [options]
```

Ou, si installé globalement :

```bash
create-arvox-app init <nom-du-projet> [options]
```

#### Options
- `-p, --package-manager <pm>` : Gestionnaire de paquets à utiliser (`npm`, `bun`, `pnpm`). Par défaut : `npm`.
- `--help` : Affiche l'aide de la CLI.

#### Exemple
```bash
npx create-arvox-app init mon-api -p pnpm
```

## Ce que fait la CLI

- Crée un dossier `<nom-du-projet>` avec la structure suivante :
	- `package.json` (préconfiguré pour arvox-backend)
	- `tsconfig.json` (TypeScript strict, outDir `dist`)
	- `src/index.ts` (point d’entrée, serveur prêt à l’emploi)
	- `src/controllers/health.controller.ts` (contrôleur de santé)
	- `README.md` (instructions de démarrage)
- Installe automatiquement les dépendances et devDependencies nécessaires
- Affiche les prochaines étapes pour démarrer le projet

## Exemple de workflow généré

```bash
npx create-arvox-app init mon-api
cd mon-api
npm run dev
```

## Scripts générés
- `dev` : Démarre le serveur en mode développement (hot reload)
- `build` : Compile le projet TypeScript
- `start` : Lance le serveur compilé

## API par défaut
- `GET /health` : Vérifie l’état du serveur
- `GET /doc` : Documentation OpenAPI (si activée dans le projet)

## Auteur
Arvox

## Licence
MIT
