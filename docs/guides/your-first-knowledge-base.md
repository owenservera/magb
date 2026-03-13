# 🧪 Your First Knowledge Base

**Time needed:** ~20 minutes  
**Prerequisites:** Basic command line knowledge, Bun installed, an AI API key (OpenAI or Anthropic)

---

## Overview

In this guide, you'll generate a complete knowledge base for the **JSON file format** — one of the simplest targets, perfect for your first run.

By the end, you'll have a database containing:
- Every JSON data type and its rules
- All syntax rules and edge cases
- Code examples for parsing and generating JSON in multiple languages
- Validation algorithms
- Architecture blueprints for building JSON tools

---

## Step 1: Clone and Install

```bash
git clone https://github.com/your-org/magb.git
cd magb
bun install
```

## Step 2: Configure Your API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Add your API key:

```env
# Choose one (or both):
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
```

> 🔒 Your API key is only used locally and never stored or transmitted anywhere except to the AI provider.

## Step 3: Generate the Knowledge Base

```bash
bun run generate --target "JSON" --verbose
```

You'll see the pipeline progress through its phases:

```
🔍 Phase 1/4: DISCOVER — Mapping JSON capabilities...
   Found 47 capabilities across 8 categories
   
📦 Phase 2/4: EXTRACT — Generating templates and algorithms...
   ████████████████████ 47/47 capabilities documented
   
✅ Phase 3/4: VALIDATE — Verifying generated content...
   Running code examples... 43/47 passed (4 auto-fixed)
   Cross-referencing... 100% coverage
   
🔗 Phase 4/4: INTEGRATE — Building architecture blueprints...
   Generated 3 application blueprints

✨ Complete! Knowledge base saved to ./output/json/
   📊 47 entries | 12 algorithms | 186 relations
   💰 Cost: $3.20 | ⏱️ Time: 4m 12s
```

## Step 4: Explore the Results

```bash
# Browse the knowledge base
bun run browse --target "JSON"

# Or query specific knowledge
bun run query "What are all the escape sequences in JSON?"
```

## Step 5: Use the Knowledge Base

The generated database is in `./output/json/` and contains:

```
output/json/
├── COMPLETE_DATABASE.json          → Machine-readable complete database
├── README.md                       → Human-readable overview
├── capabilities/                   → Feature-by-feature documentation
│   ├── string_values.json
│   ├── number_types.json
│   ├── nested_objects.json
│   └── ...
├── algorithms/                     → Parsing, validation, formatting
│   ├── recursive_descent_parser.json
│   ├── json_schema_validator.json
│   └── ...
├── structural_templates/           → Exact format specifications
│   ├── minimal_valid_file.json
│   ├── all_data_types.json
│   └── ...
├── blueprints/                     → Application architectures
│   ├── json_parser_from_scratch.json
│   ├── json_editor.json
│   └── ...
└── composition_rules/              → How features interact
    └── nesting_limits.json
```

---

## What's Next?

- **Try a bigger target:** `bun run generate --target "Python 3.12"`
- **Read about the database schema:** [Database Schema](../architecture/database-schema.md)
- **Learn about the pipeline:** [How It Works](../concepts/how-it-works.md)
- **Contribute:** [Contributing Guide](../../CONTRIBUTING.md)

---

> ⚠️ **Note:** This guide describes the intended workflow. The pipeline is currently under development. Star the repo to be notified when it's ready!
