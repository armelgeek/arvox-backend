#!/bin/bash

echo "🔄 Running initial migration for Better Auth..."

# Install dependencies if not present
if ! command -v drizzle-kit &> /dev/null; then
    echo "Installing drizzle-kit..."
    npm install -D drizzle-kit
fi

# Generate migration
echo "Generating migration..."
npx drizzle-kit generate:postgresql

# Run migration
echo "Running migration..."
npx drizzle-kit push:postgresql

echo "✅ Initial migration completed!"
