# Security Policy

## Supported Versions

I release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

I take the security of Open Ports Menubar seriously. If you have discovered a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Please do not create a public GitHub issue for security vulnerabilities. This helps prevent malicious exploitation before a fix is available.

### 2. Contact the Maintainer

Report security vulnerabilities directly to the project maintainer:

**Email:** nati@natielimelech.com

Please include:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if applicable)

### 3. Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Resolution Target:** Within 30 days for critical issues

## Security Best Practices for Users

1. **Keep the App Updated:** Always use the latest version from the [Releases](https://github.com/Nati-elimelech/open-ports-menubar/releases) page
2. **Download from Official Sources:** Only download the app from the official GitHub repository
3. **Verify Downloads:** Check the SHA256 checksum if provided with releases
4. **Review Permissions:** The app requires permission to:
   - Execute system commands (`lsof`, `kill`)
   - Access Docker CLI (if installed)
   - Read system process information

## Security Considerations

### What This App Does
- Reads local system port information using `lsof`
- Displays process and port data in the menu bar
- Can terminate processes (requires user action)
- Stores preferences locally using Electron's storage

### What This App Does NOT Do
- Does not transmit any data over the network
- Does not collect or store personal information
- Does not modify system configurations
- Does not run with elevated privileges unless explicitly granted

## Acknowledgments

I appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be acknowledged in our security advisories (with permission).

## Updates

This security policy may be updated from time to time. Check back regularly for any changes.

---

**Last Updated:** 2025-01-10  
**Maintained by:** [@Nati-elimelech](https://github.com/Nati-elimelech)