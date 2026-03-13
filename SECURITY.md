# 🔐 Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main branch (alpha) | ✅ Yes |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability within magB, please report it responsibly:

1. **Email:** Send details to **security@magb.dev**
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial Assessment** within 1 week
- **Resolution Timeline** communicated within 2 weeks
- **Credit** given in the security advisory (unless you prefer anonymity)

## Security Considerations

### AI API Keys

magB handles AI API keys through the ACE (AI Contribution Engine) system. Keys are:
- ✅ Encrypted at rest
- ✅ Never logged or stored in plaintext
- ✅ Scoped with minimal required permissions
- ✅ Rotatable without service interruption

### Generated Content

AI-generated knowledge bases should be treated as **reference material, not executable code in production** without human review. While our validation pipeline catches many errors, AI-generated content may contain:
- Incorrect edge case documentation
- Outdated information
- Subtle algorithmic errors

Always validate generated code before production use.

## Best Practices for Users

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Review generated code** before production deployment
4. **Keep dependencies updated** by watching for security advisories

## Acknowledgments

We gratefully acknowledge security researchers who help keep magB safe. Past contributors will be listed here upon their permission.

---

Thank you for helping keep magB and its users safe! 💜
