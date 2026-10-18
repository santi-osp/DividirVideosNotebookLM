# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

---

## Client-Side Security Model & Privacy Guarantee

Splitly is built with a **strict client-side execution model**:
1. **Zero Remote Processing**: All video splitting, audio decoding, and file conversions occur locally on your machine inside your web browser via WebAssembly.
2. **Zero Media Telemetry**: Splitly has no backend servers, no file ingestion APIs, and no analytical trackers that capture user media or file metadata.
3. **Third-Party CDN**: WebAssembly binary cores (`ffmpeg-core.js`, `ffmpeg-core.wasm`) are loaded via reputable content delivery networks (jsDelivr) using Subresource Integrity / version-pinned assets.

---

## Reporting a Vulnerability

We take the security and privacy of our users very seriously.

If you believe you have discovered a security vulnerability in Splitly, please do **NOT** report it publicly through a public GitHub issue.

Instead, please report it via:
1. **GitHub Private Vulnerability Reporting**: Navigate to the [Security Advisories](https://github.com/santi-osp/DividirVideosNotebookLM/security/advisories) tab and click **"Report a vulnerability"**.
2. **Direct Contact**: Contact the maintainer directly through their GitHub profile ([santi-osp](https://github.com/santi-osp)).

### What to Include
- Description of the vulnerability and potential impact.
- Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue.
- Browser name and version, operating system, and hardware details.

### Response Time
- We acknowledge receipt of vulnerability reports within 48 hours.
- We will coordinate a remediation timeline and provide updates until a patch is released.
