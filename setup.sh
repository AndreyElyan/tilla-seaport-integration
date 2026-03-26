#!/bin/bash
set -e

echo "=== Tilla Seaport Integration - Setup ==="

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "Please edit .env and set your AZURE_BLOB_SAS_URL before running sync."
else
  echo ".env already exists, skipping."
fi

# 3. Start PostgreSQL
echo "Starting PostgreSQL via Docker Compose..."
docker compose up -d

# 4. Wait for PostgreSQL to be healthy
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U tilla -d tilla_seaports > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

# 5. Run Prisma migrations
echo "Running database migrations..."
cd apps/backend && npx prisma migrate deploy && cd ../..

# 6. Generate Prisma client
echo "Generating Prisma client..."
npm run db:generate

echo ""
echo "=== Setup complete! ==="
echo "Run 'npm run dev' to start the application."
echo "  Backend:  http://localhost:3000/graphql"
echo "  Frontend: http://localhost:3001"
