#!/bin/bash

# Script de déploiement pour Backend Framework
# Usage: ./deploy.sh [patch|minor|major|prerelease]

set -e

VERSION_TYPE=${1:-patch}

echo "🚀 Déploiement du Backend Framework"
echo "📦 Type de version: $VERSION_TYPE"

# Vérifier que nous sommes sur la bonne branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Vous devez être sur la branche master ou main pour déployer"
    exit 1
fi

# Vérifier qu'il n'y a pas de changements non commitées
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Il y a des changements non commitées. Veuillez les commit avant de déployer."
    exit 1
fi

# Install dependencies
echo "📥 Installation des dépendances..."
bun install

# Run tests
echo "🧪 Exécution des tests..."
bun test

# Run linter
echo "🔍 Vérification du code..."
bun run lint

# Build
echo "🔨 Construction du package..."
bun run build

# Bump version
echo "📈 Mise à jour de la version..."
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Nouvelle version: $NEW_VERSION"

# Publish to npm
echo "📤 Publication sur npm..."
npm publish --access public

# Commit and tag
echo "🏷️ Création du commit et du tag..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin master
git push origin "v$NEW_VERSION"

echo "🎉 Déploiement terminé avec succès!"
echo "📦 Version publiée: $NEW_VERSION"
echo "🔗 https://www.npmjs.com/package/@arvox/backend-framework"
