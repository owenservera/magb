# 🤝 Contributing to magB

**First off — thank you!** Whether you're fixing a typo, suggesting an idea, or writing code, every contribution makes magB better for everyone.

We've designed this guide to be welcoming to **all experience levels**. You don't need to be an expert — you just need to care about making knowledge more accessible.

---

## 📋 Table of Contents

- [🧭 How Can I Help?](#-how-can-i-help)
- [🌱 First-Time Contributors](#-first-time-contributors)
- [🐛 Reporting Bugs](#-reporting-bugs)
- [💡 Suggesting Features](#-suggesting-features)
- [📖 Improving Documentation](#-improving-documentation)
- [🔧 Contributing Code](#-contributing-code)
- [🤖 Donating AI Credits](#-donating-ai-credits)
- [🧪 Testing Knowledge Bases](#-testing-knowledge-bases)
- [📝 Style Guide](#-style-guide)
- [🏷️ Commit Messages](#️-commit-messages)
- [⚖️ License](#️-license)

---

## 🧭 How Can I Help?

There are **many ways** to contribute, and not all of them involve writing code:

| Contribution | Difficulty | Impact | Perfect For |
|---|---|---|---|
| ⭐ Star the repo | Trivial | Helps visibility | Everyone |
| 🐛 Report a bug | Easy | High | Anyone who finds something broken |
| 💡 Suggest a feature | Easy | High | Anyone with ideas |
| 📖 Improve docs | Easy–Medium | Very High | Writers, teachers, anyone |
| 🧪 Test knowledge bases | Medium | Very High | Developers, domain experts |
| 🔧 Fix a bug | Medium | High | Developers |
| ✨ Add a feature | Medium–Hard | Very High | Developers |
| 🤖 Donate AI API credits | Easy | Very High | Anyone with API access |
| 📢 Spread the word | Trivial | High | Everyone |

---

## 🌱 First-Time Contributors

Never contributed to open source before? **You're exactly who we want to hear from.** Fresh eyes catch what veterans miss.

### Your First Contribution in 5 Minutes

1. **Find something to improve.** Browse the [documentation](docs/), read the [README](README.md), or look at [issues labeled `good-first-issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

2. **Fork the repo.** Click the "Fork" button at the top right of this page.

3. **Make your change.** Edit directly on GitHub or clone locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/magb.git
   cd magb
   git checkout -b my-improvement
   ```

4. **Commit and push.**
   ```bash
   git add .
   git commit -m "docs: fix typo in getting started guide"
   git push origin my-improvement
   ```

5. **Open a Pull Request.** Go to your fork on GitHub and click "Compare & pull request."

That's it! We'll review your PR and help you through any needed changes.

> 💡 **Tip:** Look for issues labeled [`good-first-issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are specifically chosen for newcomers.

---

## 🐛 Reporting Bugs

Found something that doesn't work right? **We want to know!**

1. **Check existing issues** to avoid duplicates.
2. **Open a new issue** using our [Bug Report template](../../issues/new?template=bug_report.yml).
3. Include:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

Even if you're not sure it's a bug, open an issue! We'd rather investigate a non-bug than miss a real one.

---

## 💡 Suggesting Features

Have an idea for something magB should do? We love hearing feature suggestions!

1. **Open a new issue** using our [Feature Request template](../../issues/new?template=feature_request.yml).
2. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Who this would help

Don't worry about implementation details — we'll figure those out together.

---

## 📖 Improving Documentation

**Documentation is one of the highest-impact contributions you can make.** If something confuses you, it probably confuses others too.

Ways to help:
- Fix typos or unclear wording
- Add examples that helped you understand something
- Translate documentation to other languages
- Write tutorials or guides
- Improve diagrams or visuals

All documentation lives in the [`docs/`](docs/) directory.

---

## 🔧 Contributing Code

### Setup

```bash
# Clone and install
git clone https://github.com/YOUR-USERNAME/magb.git
cd magb
bun install

# Create a branch
git checkout -b feature/my-feature

# Make your changes, then test
bun test

# Commit using conventional commits
git commit -m "feat: add support for YAML target generation"
```

### Pull Request Process

1. **Keep PRs focused.** One feature or fix per PR.
2. **Write tests** for new functionality when applicable.
3. **Update docs** if your change affects how users interact with magB.
4. **Follow the style guide** (see below).
5. **Fill out the PR template** — it helps reviewers understand your change.

### Code Review

Every PR gets reviewed by at least one maintainer. We'll:
- Be respectful and constructive
- Explain our reasoning
- Help you improve the code if needed

Don't be discouraged by review feedback — it's how we all learn and improve!

---

## 🤖 Donating AI Credits

One of the most unique ways to contribute to magB is through our **AI Contribution Engine (ACE)**. Instead of (or in addition to) donating money, you can donate **AI API credits** that are used to generate and validate knowledge bases.

Read more about ACE in our [ACE Documentation](docs/concepts/ace.md).

---

## 🧪 Testing Knowledge Bases

If you're an expert in a programming language or file format, you can help by:

1. **Reviewing generated content** for accuracy
2. **Identifying missing topics** that should be covered
3. **Testing code examples** to make sure they work
4. **Suggesting edge cases** that the AI might have missed

This doesn't require any coding — just domain knowledge!

---

## 📝 Style Guide

### Code Style

- **TypeScript/JavaScript:** Use Prettier defaults, ESLint recommended config
- **Python:** Follow PEP 8, use Ruff for linting
- **Markdown:** Use consistent heading hierarchy, wrap at 100 characters when feasible

### Documentation Style

- Write for a general audience — avoid jargon when possible
- Lead with "why" before "how"
- Include examples for every concept
- Use diagrams and visuals when they help understanding
- Keep paragraphs short (3-4 sentences max)

---

## 🏷️ Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear, automated changelogs:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
| Type | Use For |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or fixing tests |
| `chore` | Maintenance (dependencies, CI, etc.) |
| `perf` | Performance improvements |

**Examples:**
```
feat(pipeline): add YAML target support
fix(validation): handle edge case in JSON schema check
docs: add getting started guide for beginners
chore(deps): update anthropic SDK to v0.26
```

---

## ⚖️ License

By contributing to magB, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

---

<p align="center"><strong>Thank you for making magB better! 💜</strong></p>
