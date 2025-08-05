# Security Policy

## Supported Versions

We take security seriously and actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities. If you discover a security issue, please follow these steps:

### 🔒 **For Security Issues (DO NOT use public GitHub issues)**

1. **Email**: Send details to the maintainers via GitHub issue with "SECURITY" in the title
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### ⏱️ **Response Timeline**

- **Initial Response**: Within 48 hours
- **Status Update**: Weekly updates on progress
- **Resolution**: Target 30 days for critical issues

### 🛡️ **What We Promise**

- We will acknowledge receipt of your report
- We will investigate all reports thoroughly
- We will keep you informed of our progress
- We will credit you in our security advisories (unless you prefer anonymity)
- We will not take legal action against researchers who follow responsible disclosure

### 🚫 **Out of Scope**

- Social engineering attacks
- Physical attacks
- Denial of service attacks
- Issues in dependencies (please report to the respective maintainers)

## Security Best Practices

When using Pika in production:

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database**: Use strong passwords and enable SSL connections
3. **API Keys**: Rotate API keys regularly
4. **Updates**: Keep dependencies and the platform updated
5. **Access Control**: Follow principle of least privilege
6. **Monitoring**: Set up security monitoring and alerting

## License Compliance

This project is licensed under AGPL-3.0-or-later. Any use of this software must comply with the license terms, including:

- Making source code available when running as a network service
- Licensing derivative works under compatible terms
- Including proper attribution

For commercial licensing options that provide different terms, please contact us through GitHub issues.

---

**Note**: This security policy applies to the Pika platform backend. For frontend applications, please refer to their respective security policies.
