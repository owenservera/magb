# First Run Guide

Welcome to magB! This guide will get you up and running in under 10 minutes.

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)
- [PostgreSQL](https://www.postgresql.org/) (v15 or later)
- [Node.js](https://nodejs.org/) (v18 or later) — optional, Bun includes Node compatibility
- AI API Key (Z.AI, OpenAI, or Anthropic)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/magb.git
cd magb

# Install dependencies
bun install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

Required variables:
```bash
# Database connection
DATABASE_URL=postgresql://postgres:password@localhost:5433/magb

# AI API key (choose one)
ZAI_API_KEY=your-zai-api-key
# OR
OPENAI_API_KEY=your-openai-api-key
# OR
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Start Database

**Option A: Docker (Recommended)**
```bash
docker-compose up -d db
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb -U postgres magb

# Or using psql
psql -U postgres -c "CREATE DATABASE magb;"
```

### 4. Initialize Database

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Seed with sample data
bun run db:seed
```

### 5. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## Verify Installation

### Check Database Connection

```bash
# Run health check
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### Check Statistics

```bash
curl http://localhost:3000/api/v1/meta/statistics
```

### Run Tests

```bash
# Run test suite
bun run test

# Run with coverage
bun run test:coverage
```

---

## Your First Knowledge Generation

### Generate Knowledge for a Target

```bash
# Generate knowledge for JSON format
bun run src/pipeline/cli.ts --target json --target-type DATA_FORMAT
```

This will:
1. Discover all JSON capabilities (Layer 1)
2. Extract structural templates and algorithms (Layer 2)
3. Generate composition rules and blueprints (Layer 3)

**Note:** Generation requires an AI API key and will consume tokens. Estimated cost for JSON: $5-10.

### Monitor Progress

The CLI shows real-time progress:
```
Starting generation for json (runId: abc-123)
📋 Starting Layer 1 task: discover_capabilities_json
✅ Layer 1 task completed: discover_capabilities_json
Discovered 25 capabilities. Proceeding to Layer 2.
📋 Starting Layer 2 task: extract_template_json_parse
✅ Layer 2 task completed: extract_template_json_parse
...
```

### View Generated Knowledge

After generation completes:

1. **Browse Targets**: Navigate to http://localhost:3000/explore/targets
2. **View JSON**: Click on "JSON" to see capabilities
3. **Explore Bundle**: Click a capability to see templates and algorithms

---

## Common Tasks

### Start Database Proxy (Cloud SQL)

```bash
# For Google Cloud SQL
./start-magb-proxy.sh
```

### Open Prisma Studio

```bash
bun run db:studio
```

Browse to http://localhost:5555 to explore your database visually.

### Generate Specific Target

```bash
# Python programming language
bun run src/pipeline/cli.ts --target python --target-type PROGRAMMING_LANGUAGE

# PPTX file format
bun run src/pipeline/cli.ts --target pptx --target-type FILE_FORMAT
```

### Resume Failed Generation

```bash
# Resume from last checkpoint
bun run src/pipeline/cli.ts --target json --resume
```

### Clear Checkpoints and Restart

```bash
# Remove checkpoint files
rm -rf checkpoints/*.json

# Run fresh generation
bun run src/pipeline/cli.ts --target json
```

---

## Troubleshooting

### Database Connection Error

**Problem:** `Can't reach database server at localhost:5433`

**Solutions:**
1. Ensure PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env.local`
3. Verify port (default: 5433 for proxy, 5432 for direct)

### Prisma Client Errors

**Problem:** `@prisma/client did not initialize`

**Solutions:**
```bash
# Regenerate Prisma client
bunx prisma generate

# Clear cache and reinstall
rm -rf node_modules/.prisma
bun install
```

### API Rate Limiting

**Problem:** `429 Too Many Requests`

**Solutions:**
1. Wait a few minutes and retry
2. Reduce `RATE_LIMIT_REQUESTS_PER_SECOND` in config
3. Use `--resume` to continue from checkpoint

### Generation Produces Empty Results

**Problem:** No capabilities discovered

**Solutions:**
1. Check AI API key is valid
2. Review logs for parsing errors
3. Try a simpler target first (JSON, YAML)

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use`

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 bun run dev
```

---

## Next Steps

### Explore the UI

- **Dashboard** (http://localhost:3000) — Overview and quick actions
- **Explore Targets** — Browse documented technologies
- **Search** — Find knowledge across all targets
- **Build** — Assemble knowledge for your tasks

### Read Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) — System design
- [API Documentation](docs/API.md) — REST API reference
- [Contributing Guide](CONTRIBUTING.md) — How to contribute

### Join the Community

- [GitHub Discussions](../../discussions) — Questions and ideas
- [GitHub Issues](../../issues) — Bug reports and features
- [Project Board](../../projects) — See what we're working on

---

## Quick Reference

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run start            # Start production server

# Database
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Run migrations
bun run db:seed          # Seed database
bun run db:studio        # Open Prisma Studio

# Testing
bun run test             # Run tests
bun run test:watch       # Watch mode
bun run test:coverage    # Coverage report

# Generation
bun run src/pipeline/cli.ts --target <name>  # Generate knowledge
```

---

*Last Updated: 2026-03-13*  
*magB — The Universal Blueprint Machine*
