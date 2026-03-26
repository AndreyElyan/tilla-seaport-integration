# Tilla Seaport Integration

Full-stack application that syncs seaport data from Azure Blob Storage (Excel files) into PostgreSQL and displays it via a React dashboard with a GraphQL API.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 9+

### Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd tilla-seaport-integration
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your AZURE_BLOB_SAS_URL

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migration
npm run db:migrate

# 5. Start both apps
npm run dev
```

The backend runs on **http://localhost:3000/graphql** and the frontend on **http://localhost:3001**.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:backend` | Start NestJS in watch mode |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

### Triggering a Sync

From the frontend, navigate to `/sync` and click **Run Sync**. Alternatively, use the GraphQL playground at `http://localhost:3000/graphql`:

```graphql
mutation {
  syncSeaports {
    totalRows
    validRows
    invalidRows
    upsertedRows
    duration
    errors { rowIndex reasons }
  }
}
```

---

## Project Structure

```
tilla-seaport-integration/
├── apps/
│   ├── backend/                 # NestJS + GraphQL + Prisma
│   │   ├── src/
│   │   │   ├── main.ts          # Fastify bootstrap + dotenv
│   │   │   ├── app.module.ts    # Root module
│   │   │   ├── prisma/          # PrismaService (global)
│   │   │   ├── seaport/         # GraphQL queries (list, search, count)
│   │   │   └── etl/             # Sync pipeline
│   │   │       ├── services/    # BlobStorage, ExcelParser, Mapper, Validator, Sync
│   │   │       ├── data/        # Country name → ISO lookup
│   │   │       └── dto/         # TypeScript interfaces
│   │   └── prisma/
│   │       └── schema.prisma    # Seaport model
│   └── frontend/                # React + Vite + Apollo Client
│       └── src/
│           ├── pages/           # SeaportsPage, SyncPage
│           ├── components/      # Layout, Search, Table, SyncButton, Banner
│           ├── graphql/         # Queries, mutations, TypeScript types
│           └── styles/          # Global CSS (dark theme)
└── packages/shared/             # Shared code (ready for future use)
```

---

## Architecture Decisions

### Monorepo with npm Workspaces

Single repository for both backend and frontend. No need for Turborepo or Nx at this scale — npm workspaces handle dependency hoisting and workspace scripts cleanly. A `packages/shared` workspace is ready for shared types or utilities.

### NestJS + Fastify (not Express)

Fastify provides better throughput and lower overhead than Express. NestJS gives us dependency injection, modular architecture, and first-class GraphQL support — all important for a codebase that will grow with more data sources.

### GraphQL Code-First with Apollo Server 5

Code-First approach keeps the schema in sync with TypeScript types automatically. Apollo Server 5 is the latest stable version with Fastify integration via `@as-integrations/fastify`. The schema is generated from decorators — no `.graphql` files to maintain.

### Prisma 7 with PG Driver Adapter

Prisma 7 moves away from the binary engine to native driver adapters. `@prisma/adapter-pg` connects directly via `pg` Pool, giving us control over connection pooling (max 5 connections, 30s idle timeout). The datasource URL lives in `prisma.config.ts` (for migrations) and `process.env.DATABASE_URL` (for runtime).

### Upsert on `locode` (Deduplication)

UN/LOCODE is a globally unique identifier for seaports. Using it as the unique constraint means:
- Re-syncing the same data is idempotent
- Updated coordinates or metadata are automatically applied
- No manual dedup logic needed

### ETL as a NestJS Service (not a standalone script)

The sync pipeline lives inside the NestJS application as injectable services. This means:
- The sync is triggerable via GraphQL mutation (from the dashboard)
- Services share the same Prisma connection pool
- Easy to add cron scheduling later via `@nestjs/schedule`
- Each step is independently testable

### Multi-Tenant via `clientSource` Column

The `clientSource` field (defaulting to `"tilla"`) tracks which client provided each seaport record. When future clients onboard, their data coexists in the same table. Queries can be scoped by source, and conflict resolution strategies can be applied per-client.

### Biome (not ESLint + Prettier)

Single tool for both linting and formatting. Faster than ESLint, zero config drift between lint and format rules, and the recommended ruleset catches real issues without noise.

---

## ETL Pipeline Details

The sync pipeline executes 5 steps sequentially:

```
Azure Blob Storage (.xlsx)
  → Step 1: Download all Excel files via SAS URL
  → Step 2: Parse with exceljs (handles rich text, formulas, DMS coords)
  → Step 3: Map columns via alias resolution (flexible header matching)
  → Step 4: Validate (required fields, coordinate ranges, LOCODE format, IANA timezones)
  → Step 5: Upsert in batches of 25 (idempotent on locode)
  → Return: SyncResult { totalRows, validRows, invalidRows, upsertedRows, errors[], duration }
```

### Column Mapping Strategy

The mapper handles real-world Excel header variability:

- **Normalization**: All headers are lowercased at parse time
- **Canonical map**: Direct matches (`"port name"` → `portName`, `"latitude"` → `latitude`)
- **Alias map**: Variants (`"portcode"`, `"unloccode"`, `"un/locode"` all → `locode`)
- **DMS conversion**: When `latitude`/`longitude` columns are empty but `latDegree`/`latMinutes`/`latDirection` exist, coordinates are computed from DMS format
- **Country resolution**: Full country names (e.g., `"Germany"`) are resolved to ISO codes (`"DE"`) via a lookup table

### Validation Rules

| Field | Rule |
|-------|------|
| `portName` | Required, non-empty |
| `locode` | Required, matches `/^[A-Z]{2}[A-Z0-9]{3}$/` |
| `latitude` | Required, valid number, range [-90, 90] |
| `longitude` | Required, valid number, range [-180, 180] |
| `timezoneOlson` | Optional, must be valid IANA timezone if present |
| `countryIso` | Optional, must match `/^[A-Z]{2}$/` if present |

Invalid rows are skipped (not upserted) but reported in the sync result with row index and failure reasons.

---

## Edge Cases Addressed

### Data Quality

- **Rich text cells**: exceljs returns `{ richText: [...] }` objects for formatted cells. The parser extracts plain text from all cell types (rich text, hyperlinks, formulas).
- **Empty columns**: The parser iterates all header columns for every row (not just non-empty cells via `eachCell`), preventing silent data loss when a column has sparse data.
- **DMS coordinates**: Many datasets store latitude/longitude in degree-minute-direction format across multiple columns. The mapper detects these and converts to decimal.
- **Country names vs codes**: The Excel may contain `"Germany"` instead of `"DE"`. A 150+ country lookup table handles the conversion transparently.
- **Duplicate locodes**: The upsert strategy means the last-seen data wins. Within a single file, this is deterministic (row order).

### Resilience

- **Missing `AZURE_BLOB_SAS_URL`**: Throws a clear error at sync start, not a cryptic undefined error deep in the stack.
- **Empty Excel files / no worksheets**: Logged and skipped, sync continues with remaining files.
- **Non-Excel files in blob container**: Skipped with a warning log.
- **Partial syncs**: Each upsert is independent (no wrapping transaction). If the process crashes mid-sync, already-upserted rows are persisted and the next sync fills in the rest.

### What Would Need Attention Before Production

- **SAS token rotation**: The current URL has an expiry. Production should use Azure Managed Identity or a token-refresh mechanism.
- **Concurrent syncs**: Two simultaneous syncs could race on the same locode. A distributed lock (Redis or advisory lock) would prevent this.
- **Locale-specific decimals**: Some European Excel files use commas as decimal separators (`51,5` instead of `51.5`). The current parser handles this if exceljs resolves it, but raw CSV imports would need explicit handling.
- **Schema evolution**: Adding new fields to the Seaport model requires a Prisma migration. A more flexible approach (JSONB for optional metadata) could reduce migration frequency.
- **Monitoring & alerting**: Sync failures should trigger alerts (e.g., via Slack webhook or PagerDuty), not just log to stdout.

---

## Scaling for High Traffic

### Read Path (API)

- **Redis caching**: Cache `seaports` query results with a TTL matching sync frequency (~12h). Invalidate on sync completion.
- **Database read replicas**: Route GraphQL queries to a read replica, writes (upserts) to the primary.
- **CDN for static frontend**: Serve the Vite build from a CDN (CloudFront, Vercel).
- **Cursor-based pagination**: Replace offset pagination with cursor-based (`WHERE id > :lastId`) for consistent performance at depth.

### Write Path (ETL)

- **Queue-based processing**: Move sync to a job queue (BullMQ + Redis). The GraphQL mutation enqueues a job; a worker processes it. This prevents long-running HTTP requests and enables retries.
- **Streaming parse**: For very large Excel files (100k+ rows), stream-parse instead of loading the entire workbook into memory.
- **Batch INSERT with ON CONFLICT**: Replace individual Prisma upserts with a raw SQL `INSERT ... ON CONFLICT (locode) DO UPDATE` for 10-50x throughput.
- **Event-driven sync**: Use Azure Event Grid to trigger sync on blob upload, instead of polling or manual triggers.

### Infrastructure

- **Horizontal scaling**: NestJS is stateless — run multiple instances behind a load balancer.
- **Connection pooling**: Use PgBouncer between the app and PostgreSQL to support hundreds of connections with a small pool.
- **Rate limiting**: Add `@nestjs/throttler` to prevent API abuse.

---

## Remote Team Effectiveness

Working effectively in a distributed, async-first team:

- **Written-first communication**: Architecture decisions, trade-offs, and context belong in PRs and docs — not Slack threads that disappear. This README is an example of that principle.
- **Self-documenting code**: Descriptive names, typed interfaces, and modular architecture reduce the need for synchronous explanations. A new team member can read `seaport-sync.service.ts` and understand the pipeline without a call.
- **Small, reviewable PRs**: Each phase of this project (scaffold, ETL, API, frontend) could be a separate PR with a clear scope. Reviewers can give meaningful feedback without context-switching through thousands of lines.
- **Proactive blocker communication**: When stuck, write down what you tried, what failed, and what you need — before the standup. This respects timezone differences and unblocks faster.
- **Overlapping hours for high-bandwidth collaboration**: Design discussions, pair debugging, and sprint planning benefit from real-time interaction. Protect 2-3 hours of overlap for these; async handles the rest.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Backend | NestJS + Fastify | 11.1.17 |
| GraphQL | Apollo Server | 5.5.0 |
| ORM | Prisma | 7.5.0 |
| Database | PostgreSQL | 16 (Docker) |
| Frontend | React + Vite | 19.2.4 / 6.4.1 |
| GraphQL Client | Apollo Client | 4.1.6 |
| Excel Parsing | exceljs | 4.4.0 |
| Azure Storage | @azure/storage-blob | 12.31.0 |
| Linting | Biome | 2.4.9 |
| Monorepo | npm workspaces | - |
