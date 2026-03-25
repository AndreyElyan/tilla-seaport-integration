# Tilla Seaport Integration - Task Breakdown

## Context

Coding challenge for Tilla Technologies. Build a full-stack app that syncs seaport data from an Azure Blob Storage (Excel file) into a local PostgreSQL database and displays it on a React dashboard via GraphQL.

**Key business rules:**
- Multi-tenant platform — other clients may provide seaport data in the future
- Data must be unique (no duplicates)
- Data quality is critical
- Data should be kept in sync with the client's source (~2x/day updates)

---

## Seaport Schema (Data Contract)

| Field           | Field Name     | Type                  | Requirement   |
|-----------------|----------------|-----------------------|---------------|
| Port Name       | `portName`     | string                | Mandatory     |
| Port Locode     | `locode`       | string (UN Locode)    | Mandatory     |
| Latitude        | `latitude`     | float                 | Mandatory     |
| Longitude       | `longitude`    | float                 | Mandatory     |
| Timezone        | `timezoneOlson`| string                | Recommended   |
| Port Country ISO| `countryIso`   | string (ISO 3166-1 α2)| Nice To Have  |

---

## Tasks

### Phase 1 — Project Scaffold & Infrastructure

- [ ] **1.1** Initialize monorepo (or structured project) with backend + frontend
- [ ] **1.2** Set up Docker Compose with PostgreSQL
- [ ] **1.3** Configure Prisma ORM with PostgreSQL connection
- [ ] **1.4** Define Prisma schema for the `Seaport` model matching the data contract
  - `locode` as unique key (natural dedup key for UN Locodes)
  - Include `clientSource` field for multi-tenant tracking
  - Include `createdAt` / `updatedAt` timestamps
- [ ] **1.5** Run initial Prisma migration
- [ ] **1.6** Scaffold NestJS backend application
- [ ] **1.7** Scaffold React frontend (Vite)

### Phase 2 — ETL / Integration Layer

- [ ] **2.1** Connect to Azure Blob Storage using the provided SAS token
  - URL: `https://tillachallenge.blob.core.windows.net/challenge-data?sp=rl&st=2026-02-10T07:18:36Z&se=2026-04-01T15:33:36Z&spr=https&sv=2024-11-04&sr=c&sig=hWOx9eiybuxnOIIFwUqtNQF%2FMz5oyAwV8HXJWt6pYjM%3D`
- [ ] **2.2** List and download the Excel file(s) from the blob container
- [ ] **2.3** Parse the Excel file (e.g., using `exceljs` or `xlsx`)
- [ ] **2.4** Map/transform raw Excel columns to our Seaport schema
  - Handle column name mismatches, casing, whitespace
- [ ] **2.5** Validate each row:
  - Mandatory fields present (`portName`, `locode`, `latitude`, `longitude`)
  - Lat/lng are valid floats within range (-90..90 / -180..180)
  - `countryIso` is valid ISO 3166-1 alpha-2 if present
  - `timezoneOlson` is valid IANA timezone if present
  - `locode` follows UN/LOCODE format
- [ ] **2.6** Upsert validated data into PostgreSQL (deduplicate on `locode`)
- [ ] **2.7** Log/report invalid rows (skip but don't fail the whole sync)
- [ ] **2.8** Create a NestJS command/service or standalone script to trigger the sync
- [ ] **2.9** (Optional) Schedule sync via cron (~2x/day) or make it triggerable via API

### Phase 3 — Backend API (GraphQL)

- [ ] **3.1** Set up GraphQL module in NestJS (`@nestjs/graphql` + Apollo)
- [ ] **3.2** Create Seaport GraphQL type/schema
- [ ] **3.3** Create Seaport resolver with queries:
  - `seaports` — list all (with pagination, filtering, sorting)
  - `seaport(locode: String!)` — get single seaport
- [ ] **3.4** Create Seaport service backed by Prisma
- [ ] **3.5** (Optional) Add a mutation or endpoint to trigger a manual sync

### Phase 4 — Frontend (React Dashboard)

- [ ] **4.1** Set up React app with Vite + TypeScript
- [ ] **4.2** Configure GraphQL client (Apollo Client or urql)
- [ ] **4.3** Create seaport data table component
  - Display all seaport schema fields
  - Pagination support
- [ ] **4.4** Add search/filter functionality (by port name, locode, country)
- [ ] **4.5** Basic styling (clean, functional for support team review)
- [ ] **4.6** (Nice to have) Show sync status / last sync timestamp

### Phase 5 — Polish & Deliverables

- [ ] **5.1** Write README with:
  - Clear setup instructions
  - Bootstrap script (`docker-compose up`, migrations, seed/sync)
  - Architecture decisions and trade-offs
  - Answers to the extra questions (edge cases, scaling, remote work)
- [ ] **5.2** Create a bootstrap/setup script (`setup.sh` or similar)
- [ ] **5.3** Verify the code compiles and runs end-to-end
- [ ] **5.4** Upload to GitHub and invite reviewers
  - @umartayyab, @Calvin-Tilla, @akshatamohanty, @AleSua93
- [ ] **5.5** Record screen video walkthrough

---

## Architecture Decisions (to document)

| Decision | Options | Rationale |
|----------|---------|-----------|
| Monorepo vs separate repos | Monorepo (simpler for challenge) | Single repo, easy to bootstrap |
| ETL approach | NestJS service/command vs standalone script | Keep within NestJS for consistency |
| Dedup strategy | Upsert on `locode` | UN Locode is a globally unique identifier |
| Multi-tenant tracking | `clientSource` column | Future clients can provide overlapping data |
| Frontend framework | Vite + React | Lightweight, fast setup |
| GraphQL | Apollo Server (NestJS) + Apollo Client | Matches Tilla's stack |

---

## Extra Questions (answer in README or video)

1. **Edge cases before production:**
   - Malformed Excel files (missing sheets, extra columns, encoding issues)
   - Duplicate locodes within the same file
   - SAS token expiration handling
   - Partial sync failures (network drops mid-download)
   - Empty or zero-length files
   - Concurrent syncs from multiple clients with conflicting data
   - Lat/lng with comma as decimal separator (locale differences)

2. **Scaling for high traffic:**
   - Cache GraphQL responses (Redis, CDN)
   - Database read replicas for query load
   - Serverless ETL (AWS Lambda triggered by blob storage events)
   - Pagination and cursor-based queries to avoid full table scans
   - Rate limiting on the API

3. **Remote team effectiveness:**
   - Clear async communication (written docs, PRs with context)
   - Overlapping hours for sync collaboration
   - Self-documenting code and architecture decision records
   - Proactive status updates and blockers flagging

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Backend      | NestJS + GraphQL        |
| ORM          | Prisma                  |
| Database     | PostgreSQL (Docker)     |
| Frontend     | React + Vite + TypeScript |
| ETL          | NestJS service + exceljs |
| Infra (local)| Docker Compose          |
