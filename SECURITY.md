# Security Policy

## Reporting a Vulnerability

Report potential vulnerabilities privately through this repository's GitHub Security Advisories page using Private Vulnerability Reporting. Do not open a public issue, pull request, or discussion for an unpatched vulnerability.

## Supported Versions

Supported versions and the security-fix support window will be documented with each public release.

## Before a Public npm Release

Keep Private Vulnerability Reporting active and enable GitHub's available dependency and secret-scanning alerts. Bootstrap the brand-new npm package interactively with maintainer 2FA and no automation token because trusted and staged publishing require an existing package.

After bootstrap, register the exact repository, `publish.yml`, and `npm` environment as the trusted publisher. Allow only `npm stage publish`, disallow token publishing, and require maintainer 2FA approval for every staged version.

## Disclosure

The maintainer will assess the report, prepare a remediation when applicable, and decide whether to publish a GitHub security advisory or request a CVE after the remediation is available.
