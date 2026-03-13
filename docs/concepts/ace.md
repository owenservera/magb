# 🤖 AI Contribution Engine (ACE)

## A New Kind of Open Source Contribution

What if you could contribute to open source not with code or money, but with **AI compute**?

---

## The Idea

magB generates knowledge bases using AI API calls. These calls cost money. In a traditional project, that cost falls on the maintainers.

**ACE flips this model.** Community members contribute their own AI API keys (from OpenAI, Anthropic, Google, Mistral, or any provider), set a monthly budget they're comfortable with, and the system **automatically pools and allocates** those resources to advance the project.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Contributor A │  │ Contributor B │  │ Contributor C │
│ OpenAI Key   │  │ Anthropic Key │  │ Ollama (Local)│
│ $50/month    │  │ $30/month     │  │ Unlimited     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────┐
│          🔐 Secure Credential Vault                  │
│          Keys encrypted at rest, never logged        │
├─────────────────────────────────────────────────────┤
│          💰 Token Budget Manager                     │
│          Tracks every token, respects limits          │
├─────────────────────────────────────────────────────┤
│          🧠 Task Orchestration Engine                │
│          Assigns work to available resources          │
├─────────────────────────────────────────────────────┤
│          📊 Dashboard & Transparency                 │
│          See exactly where your tokens went           │
└─────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. Register Your Contribution
Tell ACE what you're contributing:
- **Which AI provider** (OpenAI, Anthropic, Google, local models, etc.)
- **Your budget** ($X per month, or specific token limits)
- **What tasks you allow** (code generation, documentation, validation, etc.)
- **Time preferences** (only use during off-peak hours to save money)

### 2. ACE Manages Everything
The system:
- **Encrypts your key** and never logs it
- **Respects your budget** — never exceeds your limits
- **Distributes work fairly** across all contributors
- **Tracks every token** with full transparency

### 3. See Your Impact
A public dashboard shows:
- How many knowledge entries your contribution generated
- Which targets your tokens helped complete
- Your total impact on the project

---

## Security First

Your API keys are treated with the highest security:

| Security Feature | Implementation |
|---|---|
| Encryption at Rest | Keys encrypted using industry-standard encryption |
| Zero Logging | Keys are never written to logs, error messages, or telemetry |
| Scoped Access | Keys are used only for authorized task types |
| Credential Rotation | Regular reminders and seamless key rotation |
| Audit Trail | Every API call logged (without key content) for transparency |

**You stay in control.** Pause or revoke your contribution at any time. Set daily, monthly, or per-task spending limits.

---

## Why This Matters

Traditional open source has three contribution types: **code, documentation, and money**. ACE adds a fourth: **AI compute**.

This is especially powerful because:
- Many developers have **AI API credits they're not fully using**
- Contributing AI compute doesn't require coding skills
- Small contributions from many people add up to large impact
- It aligns incentives: **contributors power the tool they benefit from**

---

## Getting Started with ACE

> ⚠️ ACE is under development. The following shows the planned workflow.

```bash
# Register your AI contribution
magb ace register --provider openai --budget 50/month

# Check your contribution status
magb ace status

# View the impact dashboard
magb ace dashboard
```

---

## Learn More

- **[Full ACE Technical Specification](../../design/BYOkb%20Open%20Source%20API%20sharing%20system%20-%20Opus%204.6%20Thinking.md)** — Complete system design
- **[Contributing Guide](../../CONTRIBUTING.md)** — Other ways to contribute
- **[Security Policy](../../SECURITY.md)** — How we protect your credentials
