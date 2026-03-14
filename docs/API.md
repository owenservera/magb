# API Documentation

Complete reference for the magB REST API.

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://your-domain.com/api/v1
```

## Authentication

Most endpoints require an API key passed in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/targets
```

Set the API key in the UI via the Settings page.

## Response Format

All responses follow this structure:

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    timestamp?: string;
  };
}
```

Error responses:

```typescript
interface ApiError {
  error: string;
  status: number;
}
```

---

## Explore Endpoints

### List Targets

```http
GET /v1/targets
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `kind` | string | — | Filter by target kind (e.g., `DATA_FORMAT`) |
| `search` | string | — | Search by name or description |
| `limit` | number | 20 | Maximum results to return |
| `offset` | number | 0 | Pagination offset |

**Example:**

```bash
curl "http://localhost:3000/api/v1/targets?kind=DATA_FORMAT&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "id": "json",
      "name": "JSON",
      "kind": "DATA_FORMAT",
      "description": "JavaScript Object Notation",
      "extensions": [".json"],
      "media_types": ["application/json"],
      "capability_count": 25,
      "generation_status": "COMPLETED"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

---

### Get Target

```http
GET /v1/targets/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Target ID (e.g., `json`, `python`) |

**Example:**

```bash
curl http://localhost:3000/api/v1/targets/json
```

**Response:**

```json
{
  "data": {
    "id": "json",
    "name": "JSON",
    "kind": "DATA_FORMAT",
    "description": "JavaScript Object Notation",
    "extensions": [".json"],
    "generation_status": "COMPLETED",
    "capabilities": [
      {
        "id": "cap_json_parse",
        "name": "Parse JSON",
        "category": "Parsing",
        "complexity": "BASIC"
      }
    ],
    "recent_entries": [...],
    "recent_atoms": [...]
  }
}
```

---

### List Concepts

```http
GET /v1/concepts
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | string | — | Filter by domain (e.g., `control_flow`) |
| `search` | string | — | Search by name or description |

**Example:**

```bash
curl "http://localhost:3000/api/v1/concepts?domain=control_flow"
```

---

### Graph Neighbors

```http
GET /v1/graph/neighbors/:nodeId
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `relationship` | string | — | Filter by relationship type |
| `direction` | string | `outgoing` | `outgoing`, `incoming`, or `both` |
| `depth` | number | 1 | Graph traversal depth |

**Example:**

```bash
curl "http://localhost:3000/api/v1/graph/neighbors/cap_json_parse?depth=2"
```

**Response:**

```json
{
  "data": {
    "nodes": [
      { "id": "cap_json_parse", "type": "capability", "name": "Parse JSON" },
      { "id": "atom_json_template", "type": "atom", "name": "JSON Template" }
    ],
    "edges": [
      {
        "source": "cap_json_parse",
        "target": "atom_json_template",
        "relationship": "REQUIRES"
      }
    ]
  }
}
```

---

## Retrieve Endpoints

### Capability Bundle

```http
GET /v1/capabilities/:id/bundle
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `implementation_language` | string | — | Preferred implementation language |
| `include_prerequisites` | boolean | false | Include prerequisite capabilities |
| `include_edge_cases` | boolean | false | Include edge case information |

**Example:**

```bash
curl "http://localhost:3000/api/v1/capabilities/cap_json_parse/bundle"
```

**Response:**

```json
{
  "data": {
    "capability": {
      "id": "cap_json_parse",
      "name": "Parse JSON",
      "description": "Convert a JSON string into a data structure",
      "complexity": "BASIC",
      "category": "Parsing"
    },
    "structural_templates": [
      {
        "id": "atom_json_template",
        "name": "JSON Template",
        "structure": { ... }
      }
    ],
    "algorithms": [
      {
        "id": "algo_json_recursive_descent",
        "name": "Recursive Descent Parsing",
        "purpose": "Parse JSON using recursive descent",
        "pseudocode": "[\"function parse():\", \"  skip whitespace\", ...]"
      }
    ]
  }
}
```

---

### Get Algorithm

```http
GET /v1/algorithms/:id
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `implementation_language` | string | — | Preferred language |
| `include_optimizations` | boolean | false | Include optimization details |
| `include_test_vectors` | boolean | false | Include test vectors |

**Example:**

```bash
curl "http://localhost:3000/api/v1/algorithms/algo_json_recursive_descent"
```

---

### Get Structure Template

```http
GET /v1/structures/:id
```

**Example:**

```bash
curl http://localhost:3000/api/v1/structures/atom_json_template
```

---

### Coordinate System

```http
GET /v1/targets/:id/coordinate-system
```

**Example:**

```bash
curl http://localhost:3000/api/v1/targets/pptx/coordinate-system
```

---

### Minimal File

```http
GET /v1/targets/:id/minimal-file
```

**Example:**

```bash
curl http://localhost:3000/api/v1/targets/json/minimal-file
```

---

## Synthesize Endpoints

### Assemble Knowledge

```http
POST /v1/assemble
```

**Request Body:**

```typescript
interface AssembleRequest {
  target: string;
  task: string;
  implementation_language?: string;
  include_tests?: boolean;
  include_edge_cases?: boolean;
  max_context_tokens?: number;
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/assemble \
  -H "Content-Type: application/json" \
  -d '{
    "target": "json",
    "task": "Create a JSON parser with validation",
    "implementation_language": "python",
    "include_tests": true
  }'
```

**Response:**

```json
{
  "data": {
    "usage_guide": "Use these components to build your JSON parser...",
    "structural_templates": [...],
    "algorithms": [...],
    "coordinate_system": {...}
  }
}
```

---

## Search Endpoints

### Search

```http
POST /v1/search
```

**Request Body:**

```typescript
interface SearchRequest {
  query: string;
  node_types?: string[];  // ['entry', 'capability', 'algorithm']
  targets?: string[];     // ['json', 'python']
  limit?: number;
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "json parsing",
    "node_types": ["algorithm"],
    "limit": 10
  }'
```

**Response:**

```json
{
  "data": [
    {
      "id": "algo_json_recursive_descent",
      "type": "algorithm",
      "name": "Recursive Descent Parsing",
      "snippet": "Parse JSON using recursive descent algorithm",
      "target_id": "json"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 10
  }
}
```

---

## AI Context Endpoints

### Generate AI Context

```http
POST /v1/ai/context
```

**Request Body:**

```typescript
interface AIContextRequest {
  target: string;
  task: string;
  implementation_language?: string;
  max_context_tokens?: number;
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/ai/context \
  -H "Content-Type: application/json" \
  -d '{
    "target": "json",
    "task": "Build a JSON validator",
    "max_context_tokens": 4000
  }'
```

**Response:** (Plain text, `Content-Type: text/plain`)

```
=== magB Knowledge Context ===
Target: JSON
Task: Build a JSON validator

[Relevant capabilities, templates, algorithms, and examples...]

=== End Context ===
```

---

## Health Endpoints

### Health Check

```http
GET /v1/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

---

### Vitality Overview

```http
GET /v1/vitality
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | — | Filter by target ID |

**Response:**

```json
{
  "data": {
    "overall_vitality": 85,
    "freshness": 90,
    "correctness": 80,
    "completeness": 85,
    "healthy_nodes": 100,
    "critical_nodes": 10,
    "total_nodes": 110
  },
  "meta": {
    "timestamp": "2026-03-13T12:00:00.000Z",
    "target": "all"
  }
}
```

---

## Meta Endpoints

### Statistics

```http
GET /v1/meta/statistics
```

**Response:**

```json
{
  "data": {
    "targets_documented": 5,
    "total_entries": 500,
    "total_atoms": 200,
    "total_capabilities": 150,
    "total_algorithms": 100,
    "total_blueprints": 20,
    "total_edges": 800,
    "total_cost_usd": 45.50,
    "total_api_calls": 1200
  }
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Database or service unavailable |

---

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Default:** 100 requests per minute
- **Burst:** 20 requests

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647172800
```

---

## Client Libraries

### TypeScript (Included)

```typescript
import { api } from '@/lib/api-client';

// List targets
const targets = await api.targets.list({ limit: 10 });

// Get capability bundle
const bundle = await api.capabilities.bundle('cap_json_parse');

// Search
const results = await api.search.run({
  query: 'json parsing',
  limit: 10
});
```

---

*Last Updated: 2026-03-13*  
*magB — The Universal Blueprint Machine*
