# AGENT PROMPT — magB Cloud SQL for PostgreSQL POC Setup
# Execute this via Google Cloud CLI on the local machine
# Target: Cloud SQL PostgreSQL 15 + pgvector + pg_trgm, Prisma-compatible

---

## ROLE & OBJECTIVE

You are a Google Cloud infrastructure agent. Your task is to provision a Cloud SQL for PostgreSQL instance suitable for the magB POC — a knowledge graph database requiring the `pgvector` and `pg_trgm` extensions, managed via Prisma ORM.

Execute every step sequentially. Before running any command, verify its prerequisites. After each command, confirm success before proceeding. If a command fails, diagnose the error and attempt a fix — do not skip steps.

---

## PHASE 0: PRE-FLIGHT CHECKS

Run these checks first. Do not proceed if any fail.

```bash
# 1. Confirm gcloud is installed and authenticated
gcloud version
gcloud auth list

# 2. Confirm an active project is set
gcloud config get-value project

# 3. If no project is set, list available projects and prompt the user to choose one
gcloud projects list
# Then: gcloud config set project YOUR_PROJECT_ID

# 4. Confirm billing is enabled (Cloud SQL requires it — the $300 trial credit counts)
gcloud billing projects describe $(gcloud config get-value project)
```

**Gate**: If `billingEnabled: false` is returned, stop and instruct the user to enable billing 
at https://console.cloud.google.com/billing — the $300 free trial credit will be applied 
automatically and no charges will occur during the trial.

---

## PHASE 1: ENABLE REQUIRED APIS

```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# Confirm all three are enabled
gcloud services list --enabled --filter="NAME:(sqladmin OR sql-component OR servicenetworking)"
```

Wait for each `enable` command to fully complete before running the next.

---

## PHASE 2: CAPTURE CONFIGURATION VARIABLES

Set these shell variables — they will be referenced throughout all subsequent commands.

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"                        # Change if preferred — must support Cloud SQL
INSTANCE_NAME="magb-poc"
DB_NAME="magb"
DB_USER="magb_user"
DB_PASSWORD=$(openssl rand -base64 24)      # Cryptographically random password
POSTGRES_VERSION="POSTGRES_15"             # PG 15 — required for pgvector stability

echo "=== CONFIG SNAPSHOT ==="
echo "Project:   $PROJECT_ID"
echo "Region:    $REGION"
echo "Instance:  $INSTANCE_NAME"
echo "DB Name:   $DB_NAME"
echo "DB User:   $DB_USER"
echo "Password:  $DB_PASSWORD"
echo "========================"
echo ""
echo "IMPORTANT: Save the password above — it will not be shown again."
```

**Checkpoint**: Print and confirm all values look correct before proceeding.

---

## PHASE 3: CREATE THE CLOUD SQL INSTANCE

```bash
gcloud sql instances create $INSTANCE_NAME \
  --database-version=$POSTGRES_VERSION \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=04:00 \
  --no-assign-ip \
  --project=$PROJECT_ID
```

### Flag explanations for the agent's awareness:
- `--tier=db-f1-micro` — shared vCPU, 614MB RAM. Sufficient for POC seeding of 2–3 targets.
- `--no-assign-ip` — no public IP by default (more secure); connection via Cloud SQL Auth Proxy.
- `--storage-auto-increase` — prevents failures if POC data grows unexpectedly.
- `--backup-start-time=04:00` — automated daily backups at 4am UTC.

**This command takes 3–7 minutes.** Poll until complete:
```bash
gcloud sql instances describe $INSTANCE_NAME --format="value(state)"
# Expected: RUNNABLE
```

Do not proceed until state is `RUNNABLE`.

---

## PHASE 4: CREATE DATABASE AND USER

```bash
# Create the application database
gcloud sql databases create $DB_NAME \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID

# Create the application user
gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID

# Confirm both were created
gcloud sql databases list --instance=$INSTANCE_NAME
gcloud sql users list --instance=$INSTANCE_NAME
```

---

## PHASE 5: ENABLE POSTGRESQL EXTENSIONS

The magB schema requires two extensions: `pgvector` and `pg_trgm`.

pgvector must be enabled via a database flag at the instance level first, then activated per-database via SQL.

```bash
# Step 5a — Enable the pgvector database flag on the instance
gcloud sql instances patch $INSTANCE_NAME \
  --database-flags=cloudsql.enable_pgvector=on \
  --project=$PROJECT_ID

# Wait for the patch to apply
gcloud sql instances describe $INSTANCE_NAME --format="value(state)"
# Wait until: RUNNABLE
```

```bash
# Step 5b — Connect via Cloud SQL Auth Proxy to run SQL commands
# First, install the proxy if not already present:
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Get the full instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)")
echo "Instance connection name: $INSTANCE_CONNECTION_NAME"

# Start the proxy in the background
./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433 &
PROXY_PID=$!
sleep 3  # Give proxy time to establish connection
```

```bash
# Step 5c — Enable extensions via psql
# If psql is not installed: sudo apt-get install postgresql-client  (Linux)
#                           brew install libpq && brew link --force libpq  (macOS)

PGPASSWORD=$DB_PASSWORD psql \
  -h 127.0.0.1 \
  -p 5433 \
  -U $DB_USER \
  -d $DB_NAME \
  -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# Verify extensions are active
PGPASSWORD=$DB_PASSWORD psql \
  -h 127.0.0.1 \
  -p 5433 \
  -U $DB_USER \
  -d $DB_NAME \
  -c "SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name IN ('vector', 'pg_trgm');"
```

Expected output: both `vector` and `pg_trgm` should show an `installed_version`.

```bash
# Stop the proxy after extension setup
kill $PROXY_PID
```

---

## PHASE 6: BUILD THE PRISMA CONNECTION STRING

Construct and output the `DATABASE_URL` for Prisma in Cloud SQL Auth Proxy mode:

```bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5433/${DB_NAME}?schema=public&connect_timeout=10"

echo ""
echo "=== PRISMA DATABASE_URL ==="
echo "$DATABASE_URL"
echo "==========================="
echo ""
echo "Add this to your .env file as:"
echo "DATABASE_URL=\"$DATABASE_URL\""
echo ""
echo "Cloud SQL Auth Proxy must be running when Prisma connects."
echo "Proxy command: ./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433"
```

---

## PHASE 7: VALIDATE PRISMA CONNECTIVITY

From the magB project root directory:

```bash
# Start proxy again
./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433 &
PROXY_PID=$!
sleep 3

# Run Prisma migration (applies schema.prisma to the live database)
npx prisma migrate dev --name init

# If migration succeeds, verify tables were created
PGPASSWORD=$DB_PASSWORD psql \
  -h 127.0.0.1 \
  -p 5433 \
  -U $DB_USER \
  -d $DB_NAME \
  -c "\dt"

# Stop proxy
kill $PROXY_PID
```

Expected: All magB tables listed (concepts, families, targets, target_versions, entries, atoms, 
capabilities, blueprints, artifacts, relations, generation_runs, validations, embeddings, 
schema_metadata, health_snapshots, health_events, decay_ledger, completeness_anchors, topic_nodes).

---

## PHASE 8: OPTIONAL — CLOUD SQL AUTH PROXY AS A BACKGROUND SERVICE

For development convenience, create a startup script so the proxy runs automatically:

```bash
cat > start-magb-proxy.sh << 'EOF'
#!/bin/bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe magb-poc --format="value(connectionName)")
./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433 &
echo "Cloud SQL Auth Proxy started on port 5433 (PID: $!)"
EOF

chmod +x start-magb-proxy.sh
echo "Run ./start-magb-proxy.sh before any Prisma commands."
```

---

## PHASE 9: FINAL REPORT

After all phases complete, output a summary:

```bash
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         magB Cloud SQL POC — Setup Complete          ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║ Instance:    $INSTANCE_NAME"
echo "║ Region:      $REGION"
echo "║ Project:     $PROJECT_ID"
echo "║ Database:    $DB_NAME"
echo "║ User:        $DB_USER"
echo "║ Extensions:  pgvector ✓  pg_trgm ✓"
echo "║ Prisma:      Migrated ✓"
echo "╠══════════════════════════════════════════════════════╣"
echo "║ NEXT STEPS:                                          ║"
echo "║  1. Add DATABASE_URL to your .env                    ║"
echo "║  2. Run ./start-magb-proxy.sh before dev sessions    ║"
echo "║  3. Run: npx prisma studio  (visual DB browser)      ║"
echo "║  4. Begin Phase 1 generation pipeline                ║"
echo "╚══════════════════════════════════════════════════════╝"
```

---

## ERROR HANDLING REFERENCE

| Error | Likely Cause | Fix |
|---|---|---|
| `PERMISSION_DENIED` on any step | Missing IAM role | Grant `roles/cloudsql.admin` to your account |
| `billing not enabled` | Trial not activated | Visit console.cloud.google.com/billing |
| `pgvector extension not found` | PG version < 14 or flag not applied | Confirm `--database-version=POSTGRES_15` and re-run Phase 5a |
| `connection refused` on psql | Proxy not running | Confirm proxy is started and listening on 5433 |
| `Prisma migrate failed` | Extension not enabled | Re-run Phase 5c before migrating |
| `quota exceeded` | Project has no billing | Enable billing (trial credit applies) |

---

## TEARDOWN (when POC is complete)

```bash
# Delete the instance (stops all billing)
gcloud sql instances delete $INSTANCE_NAME --project=$PROJECT_ID
```
