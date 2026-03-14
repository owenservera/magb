# 🗄️ Cloud SQL for PostgreSQL Setup Guide

**Set up a production-ready PostgreSQL database for magB using Google Cloud SQL with `pgvector` and `pg_trgm` extensions.**

---

## Overview

This guide walks you through setting up Google Cloud SQL for PostgreSQL 15 to host the magB knowledge graph database. You'll learn how to:

- Provision a Cloud SQL PostgreSQL instance
- Enable `pgvector` (for vector embeddings) and `pg_trgm` (for fuzzy search) extensions
- Connect via Cloud SQL Auth Proxy
- Run Prisma migrations to create the magB schema
- Configure your development environment

**Prerequisites:**
- Google Cloud account with a project
- Google Cloud CLI (`gcloud`) installed
- Node.js and npm installed
- Basic terminal/shell knowledge

---

## What is Cloud SQL?

Google Cloud SQL is a fully-managed relational database service. It handles:
- Automatic backups
- Patch management
- High availability
- Read replicas
- Point-in-time recovery

For magB's POC, we'll use the `db-f1-micro` tier (shared vCPU, 614MB RAM), which is sufficient for initial development and testing.

---

## Phase 0: Pre-Flight Checks

Before provisioning resources, verify your Google Cloud environment is ready.

```bash
# Check gcloud is installed and authenticated
gcloud version
gcloud auth list

# Check your active project
gcloud config get-value project

# If no project is set, list available projects and choose one
gcloud projects list
gcloud config set project YOUR_PROJECT_ID

# Verify billing is enabled (required for Cloud SQL)
gcloud billing projects describe $(gcloud config get-value project)
```

**Expected output for billing:**
```
billingEnabled: true
```

❗ **If `billingEnabled: false`:** Enable billing at https://console.cloud.google.com/billing. The $300 free trial credit will be applied automatically — no charges will occur during the trial.

---

## Phase 1: Enable Required APIs

Cloud SQL requires several Google Cloud APIs to be enabled:

```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# Verify all three are enabled
gcloud services list --enabled --filter="NAME:(sqladmin OR sql-component OR servicenetworking)"
```

**Expected output:**
```
NAME: servicenetworking.googleapis.com
TITLE: Service Networking API

NAME: sql-component.googleapis.com
TITLE: Cloud SQL

NAME: sqladmin.googleapis.com
TITLE: Cloud SQL Admin API
```

⏱️ **Wait for each `enable` command to complete** before running the next.

---

## Phase 2: Set Configuration Variables

Define variables that will be used throughout the setup. Adjust these values as needed for your environment.

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"                    # Change if preferred — must support Cloud SQL
INSTANCE_NAME="magb-poc"                # Your instance name
DB_NAME="magb"                          # Your database name
DB_USER="magb_user"                     # Your database user
DB_PASSWORD=$(openssl rand -base64 24)  # Generate secure password
POSTGRES_VERSION="POSTGRES_15"          # PG 15 — required for pgvector

echo "=== Configuration ==="
echo "Project:   $PROJECT_ID"
echo "Region:    $REGION"
echo "Instance:  $INSTANCE_NAME"
echo "DB Name:   $DB_NAME"
echo "DB User:   $DB_USER"
echo "Password:  $DB_PASSWORD"
echo "==================="
echo ""
echo "⚠️  IMPORTANT: Save the password above — it will not be shown again!"
```

---

## Phase 3: Create the Cloud SQL Instance

Provision the PostgreSQL instance:

```bash
gcloud sql instances create $INSTANCE_NAME \
  --database-version=$POSTGRES_VERSION \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=04:00 \
  --project=$PROJECT_ID
```

**Flag explanations:**
| Flag | Purpose |
|------|---------|
| `--tier=db-f1-micro` | Shared vCPU, 614MB RAM — sufficient for POC |
| `--storage-auto-increase` | Automatically expands storage if needed |
| `--backup-start-time=04:00` | Automated daily backups at 4am UTC |

⏱️ **This takes 3-7 minutes.** Monitor progress:

```bash
# Poll until instance is ready
gcloud sql instances describe $INSTANCE_NAME --format="value(state)"
# Expected: RUNNABLE
```

**Do not proceed** until the state is `RUNNABLE`.

---

## Phase 4: Create Database and User

Create the application database and user:

```bash
# Create the database
gcloud sql databases create $DB_NAME \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID

# Create the user
gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID

# Verify both were created
gcloud sql databases list --instance=$INSTANCE_NAME
gcloud sql users list --instance=$INSTANCE_NAME
```

---

## Phase 5: Enable PostgreSQL Extensions

magB requires two extensions:
- **`pgvector`** — For vector embeddings and similarity search
- **`pg_trgm`** — For fuzzy text search

### Step 5a: Download Cloud SQL Auth Proxy

The proxy provides secure, authenticated connections to your Cloud SQL instance.

**On Windows:**
```bash
# Download the proxy binary
curl -L -o cloud-sql-proxy.exe https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases/latest/download/cloud-sql-proxy.windows.x86_64.exe
```

**On macOS/Linux:**
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

### Step 5b: Start the Proxy

```bash
# Get the instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)")
echo "Instance connection name: $INSTANCE_CONNECTION_NAME"

# Start the proxy
./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433 &
PROXY_PID=$!
echo "Proxy started with PID: $PROXY_PID"

# Wait for connection
sleep 3
```

**Expected output:**
```
202X/XX/XX XX:XX:XX Authorizing with Application Default Credentials
202X/XX/XX XX:XX:XX [PROJECT:REGION:INSTANCE] Listening on 127.0.0.1:5433
202X/XX/XX XX:XX:XX The proxy has started successfully and is ready for new connections!
```

### Step 5c: Enable Extensions

```bash
# Verify psql is installed
psql --version

# Enable the extensions
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

**Expected output:**
```
  name   | default_version | installed_version
---------+-----------------+-------------------
 pg_trgm | 1.6             | 1.6
 vector  | 0.8.1           | 0.8.1
```

### Step 5d: Stop the Proxy

```bash
kill $PROXY_PID
```

---

## Phase 6: Configure Prisma Connection

### Build the Connection String

```bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5433/${DB_NAME}?schema=public&connect_timeout=10"

echo "=== Prisma DATABASE_URL ==="
echo "$DATABASE_URL"
echo "==========================="
echo ""
echo "Instance connection name: $INSTANCE_CONNECTION_NAME"
```

### Update Your .env File

Add the `DATABASE_URL` to your `.env` file:

```bash
# .env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@127.0.0.1:5433/magb?schema=public&connect_timeout=10"
```

---

## Phase 7: Run Prisma Migrations

Apply the magB schema to your database:

```bash
# Start the proxy
./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --port=5433 &
PROXY_PID=$!
sleep 3

# Run migrations
npx prisma migrate dev --name init

# Verify tables were created
PGPASSWORD=$DB_PASSWORD psql \
  -h 127.0.0.1 \
  -p 5433 \
  -U $DB_USER \
  -d $DB_NAME \
  -c "\dt"

# Stop the proxy
kill $PROXY_PID
```

**Expected tables** (22 total):
- `algorithms`, `artifacts`, `atoms`
- `blueprints`, `capabilities`, `concepts`, `completeness_anchors`
- `decay_ledger`, `embeddings`, `entries`, `examples`
- `families`, `generation_runs`, `health_events`, `health_snapshots`
- `relations`, `schema_metadata`, `target_versions`, `targets`, `topic_nodes`
- `validations`

---

## Phase 8: Create a Startup Script (Optional)

For development convenience, create a script to start the proxy automatically:

**Windows (Git Bash):**
```bash
cat > start-magb-proxy.sh << 'EOF'
#!/bin/bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe magb-poc --format="value(connectionName)")
./cloud-sql-proxy.exe $INSTANCE_CONNECTION_NAME --port=5433 &
echo "Cloud SQL Auth Proxy started on port 5433 (PID: $!)"
EOF

chmod +x start-magb-proxy.sh
```

**Usage:**
```bash
./start-magb-proxy.sh
```

---

## Summary

After completing all phases, you'll have:

- ✅ Cloud SQL PostgreSQL 15 instance (`magb-poc`)
- ✅ Database `magb` with user `magb_user`
- ✅ Extensions: `pgvector` v0.8.1 and `pg_trgm` v1.6 enabled
- ✅ Prisma schema migrated (22 tables created)
- ✅ Cloud SQL Auth Proxy configured

---

## Next Steps

1. **Start the proxy** before development sessions:
   ```bash
   ./start-magb-proxy.sh
   ```

2. **Open Prisma Studio** to explore your database:
   ```bash
   npx prisma studio
   ```

3. **Begin Phase 1 generation pipeline** — create your first knowledge base!

---

## Troubleshooting

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `PERMISSION_DENIED` | Missing IAM role | Grant `roles/cloudsql.admin` to your account |
| `billing not enabled` | Trial not activated | Visit console.cloud.google.com/billing |
| `pgvector extension not found` | PG version < 14 | Confirm `--database-version=POSTGRES_15` |
| `connection refused` on psql | Proxy not running | Confirm proxy is started and listening on port 5433 |
| `Prisma migrate failed` | Extension not enabled | Re-run Phase 5c before migrating |
| `quota exceeded` | Project has no billing | Enable billing (trial credit applies) |

---

## Cleanup (When POC is Complete)

To stop all billing:

```bash
# Delete the instance
gcloud sql instances delete $INSTANCE_NAME --project=$PROJECT_ID
```

---

<p align="center"><em>Questions? <a href="https://github.com/your-org/magb/discussions">Ask in Discussions</a> — we're happy to help!</em></p>
