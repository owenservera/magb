# ❓ Frequently Asked Questions

---

## General

### What is magB?
magB (The Universal Blueprint Machine) is an AI-powered system that generates complete, structured, verified knowledge bases for any programming language, file format, or software tool. Think of it as downloading an expert's entire knowledge about a technology into a organized, queryable database.

### Is magB free?
Yes! magB is fully open-source under the Apache 2.0 license. You can use, modify, and distribute it freely, including in commercial products.

### What does "magB" stand for?
It's short for "Magnetic Blueprint" — the idea that knowledge should be magnetic, attracting and organizing information into structured blueprints.

---

## How It Works

### Isn't this just documentation?
No. Traditional documentation tells you *about* something. magB gives you *everything you need to build* something. The key differences:
- **Complete** — not "some examples" but *every* capability
- **Structural** — exact templates you can copy, not descriptions
- **Verified** — generated code is executed to prove it works
- **Three layers** — from "what" to "how" to "build this complete application"

### How accurate is AI-generated content?
magB uses a multi-stage validation pipeline:
1. Cross-referencing against completeness anchors
2. Different AI models validating each other's work
3. Code execution to verify examples
4. Statistical accuracy monitoring

No system is 100% perfect, but magB's validation catches the vast majority of errors. All content includes confidence scores so you know what's well-verified.

### Does this work for any technology?
magB is designed to be universal. It can generate knowledge bases for:
- Programming languages (Python, Rust, TypeScript, ...)
- File formats (PPTX, PDF, PNG, SVG, ...)
- Software tools (Photoshop-equivalent algorithms, ...)
- Data formats (JSON, YAML, Protobuf, ...)

### How long does generation take?
Depends on the target complexity:
- Simple format (JSON): ~2 minutes, ~$5
- Programming language (Python): ~8 minutes, ~$50-80
- Complex format (PPTX): ~15 minutes, ~$85-165

---

## Usage

### Do I need AI API keys?
- **To generate** new knowledge bases: Yes, you need API access to OpenAI, Anthropic, or another LLM provider.
- **To use** pre-generated knowledge bases: No.

### Can I use magB's output in my own products?
Yes! The generated knowledge bases are Apache 2.0 licensed. Use them however you want, including in commercial products.

### How do I query a knowledge base?
Three ways:
1. **CLI** — `magb query "How do I escape strings in JSON?"`
2. **API** — RESTful API for programmatic access
3. **Direct** — Browse the generated files directly

---

## Contributing

### I'm not a developer. Can I still contribute?
Absolutely! You can:
- Report bugs or confusing documentation
- Suggest technologies that should be covered
- Test generated knowledge bases for accuracy
- Donate AI API credits through ACE
- Spread the word

### What is ACE?
The AI Contribution Engine lets community members donate AI API credits (instead of or in addition to code/money) to power knowledge base generation. See [ACE Documentation](concepts/ace.md).

### How do I get started contributing?
Read our [Contributing Guide](../CONTRIBUTING.md). Look for issues labeled `good-first-issue` for beginner-friendly tasks.

---

## Technical

### Why PostgreSQL and not MongoDB/SQLite/etc.?
PostgreSQL gives us everything in one database:
- **pgvector** for semantic search
- **Recursive CTEs** for graph traversal
- **Full-text search** for keyword queries
- **JSONB** for flexible structured data

At ~250GB total, it fits on a single instance — no need for distributed complexity.

### Why generate with AI instead of parsing specs?
Specifications tell you what's *valid*, not how to *build things*. LLMs have been trained on specs, source code, tutorials, and real implementations — they can synthesize practical, implementation-focused knowledge that specs alone can't provide. magB's pipeline then verifies this knowledge for accuracy.

### Can I run this locally?
Yes! magB is designed to run on a developer's machine. Docker Compose will bring up the database and pipeline. You provide your own AI API keys.

---

<p align="center"><em>Have a question not answered here? <a href="https://github.com/your-org/magb/discussions">Ask in Discussions</a>.</em></p>
