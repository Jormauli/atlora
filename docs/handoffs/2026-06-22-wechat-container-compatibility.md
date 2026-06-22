# WeChat container compatibility check

Date: 2026-06-22

## Scope

Validate whether the existing Python and Camoufox WeChat extractor can be packaged for a Linux amd64 worker without changing the current Vercel application.

## Verified

- Docker Desktop 4.73.0 and Docker Engine 29.4.3 are available locally.
- `python:3.11-slim-bookworm` runs as both native `linux/arm64` and emulated `linux/amd64` after restarting Docker Desktop.
- The pinned Python dependency layer builds for `linux/amd64`.
- Debian browser dependencies install successfully when the package source uses HTTPS and bounded retries.
- Python dependencies install successfully from a configurable package index.
- The extractor repository is pinned to commit `c52b2aa2aa6f0f0e3689c978db8f183038d2f00c`.
- The official Camoufox Linux x86_64 archive was downloaded from the upstream GitHub release with byte ranges and passed a full ZIP CRC check.
  - Version: `135.0.1-beta.24`
  - Size: `712711368` bytes
  - SHA-256: `61e1ec455e021720af38a5cc5ff7566121363cb5b82b72f24e381ba2676a4888`

## Not yet verified

- Starting Camoufox inside the completed local amd64 image.
- Exporting the real test article to Markdown inside Linux.
- Peak memory, elapsed extraction time, and final image size.

## Local blockers found

1. Docker's `desktop` credential helper hangs. Public image pulls work with a temporary Docker config that does not use the helper.
2. The macOS system proxy at `127.0.0.1:7897` intermittently truncates Docker build downloads. HTTPS Debian sources and a configurable Python package index avoid the affected paths.
3. Docker Desktop can start the official amd64 base image but leaves locally built amd64 images in `Created`. Rebuilding after restart and removing BuildKit provenance did not change this. This is a local Docker Desktop runtime issue, not an extractor exception.
4. Camoufox's official Linux runtime archive is about 713 MB before extraction. This materially affects image size, build time, cold start, and deployment cost.

## Decision

Do not put Python and Camoufox into the Vercel web deployment. Keep the asynchronous Vercel + task queue + dedicated worker design.

The next useful test is a build in the actual Linux amd64 deployment environment, preferably Cloud Build followed by a private Cloud Run worker deployment. That test removes macOS emulation and Docker Desktop from the path and directly measures the production constraints.

Do not push or switch production traffic until the cloud worker passes:

1. Headless Camoufox smoke test.
2. Real WeChat article extraction.
3. Timeout and structured failure behavior.
4. Memory, duration, image size, and cold-start measurement.
