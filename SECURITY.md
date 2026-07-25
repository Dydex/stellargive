# Security Policy

## Supported Versions

The following versions of the project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| < v1.0  | :x:                |

## Reporting a Vulnerability

We take the security of our project very seriously. If you believe you have found a security vulnerability, please follow our responsible disclosure process.

**DO NOT** expose security reports publicly. Do not open a public issue or pull request.

Please report vulnerabilities through our private reporting channel using the **Private Vulnerability Reporting** feature on GitHub (under the Security tab). Alternatively, you can email us directly.

When reporting a vulnerability, please include:
- A description of the vulnerability and its potential impact.
- The steps required to reproduce the vulnerability.
- Any suggested mitigations or fixes, if you have them.
- Your contact information for follow-up.

## Response Expectations

- **Acknowledgement:** We will acknowledge receipt of your vulnerability report within 72 hours.
- **Investigation:** We will thoroughly investigate the issue and keep you updated on our progress.
- **Remediation:** If the vulnerability is confirmed, we will work to develop and release a patch as soon as possible. We expect to release fixes for confirmed vulnerabilities promptly and will notify you when the issue is resolved.

## Secret Scanning

We use two layers of automated secret scanning:

- **Gitleaks** ([`.github/workflows/gitleaks.yml`](.github/workflows/gitleaks.yml)) runs on every pull request and every push to `main`, checked against the rules and allowlist in [`.gitleaks.toml`](.gitleaks.toml).
- **GitHub push protection** (Settings → Code security → Push protection) blocks pushes that contain a secret pattern GitHub recognizes, before the commit ever reaches the remote.

### If a secret is committed or a scan flags a hit

1. **Rotate first.** Immediately revoke/rotate the credential at its source (e.g. the API provider's dashboard). Assume any committed secret is compromised the moment it's pushed, even to a private branch.
2. **Remove it from the current code.** Replace the hardcoded value with an environment variable or `.env.example` placeholder in the same commit/PR that fixes the finding.
3. **Scrub history if needed.** A new commit does not remove the secret from git history. If a real secret landed in any reachable commit, coordinate with a maintainer on a history rewrite (`git filter-repo` or the BFG Repo-Cleaner) before considering it resolved.
4. **Report it privately** using the process in [Reporting a Vulnerability](#reporting-a-vulnerability) above — do not discuss a live leaked secret in a public issue or PR comment.
5. **Only allowlist genuine false positives.** If Gitleaks flags something that isn't a real secret, add an entry to `.gitleaks.toml` with a comment explaining why it's safe, rather than disabling the rule or skipping CI.

### Push-protection expectations for contributors

If GitHub blocks a push because it detected a secret, **do not** use the "Allow secret" bypass to force it through. Remove or rotate the credential and push again. If you believe the block is a false positive, ask a maintainer to review before bypassing.
