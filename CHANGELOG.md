# CHANGELOG

## [1.8.0] - 2026-06-02
- **Neural-Adjacent Mastering & Protocol Finalization.**
- Implemented `pipeline/processing/mastering_engine.py` using dual-pass FFmpeg loudnorm.
- Targeted exact -7 LUFS for peak-time production quality.
- Finalized Section 2 Repository Sanitization Protocol with automated Git merging.
- Optimized Web UI search performance using pre-computed search tokens.
- Fixed `glob` import compatibility for Node.js 20+ environments.

## [1.7.1] - 2026-06-01
- **Automated Streaming Publishing.**
- Implemented `scripts/publish_streaming.ts` for catch-up publishing.
- Added support for automated YouTube and Soundcloud sync.
- Integrated publishing workflow into the centralized manifest management.

## [1.7.0] - 2026-05-31
- **REST API for Remote Orchestration.**
- Implemented `src/server.ts` with `/generate` and `/status` endpoints.
- Added support for asynchronous generation triggering via HTTP.
- Integrated pipeline control into a standalone Express server.

## [1.6.2] - 2026-05-30
- **Local MusicGen Inference Layer.**
- Integrated local neural sound design via `src/integrators/musicgen_service.py`.
- Updated `requirements.txt` with local neural generation dependencies.
- Enhanced `AIBridge` to support local high-fidelity texture mapping.

## [1.6.1] - 2026-05-29
- **Autonomous Vault Sync & Repo Sanitization Protocol.**
- Implemented Section 2 and Section 6 protocols via `scripts/autonomous_vault_sync.ts`.
- Enhanced `scripts/repository_sanitizer.ts` with explicit Upstream Sync and Submodule Cleanup.
- Automated git commits for vault state synchronization.

## [1.6.0] - 2026-05-28
- **Unified TypeScript Architecture & Audio-Reactive Visuals.**
- Ported \`HouseStructuralQuantizer\` from Python to TypeScript (\`src/sequencer/house_generator.ts\`).
- Implemented audio-reactive music video generation in \`VideoGenerator.ts\` using FFmpeg showwaves and avectorscope.
- Simplified autonomous orchestration in \`scripts/autonomous_production.ts\`.
- Updated documentation to reflect Version 1.6.0 status and Phase 3 visual focus.

## [1.5.0] - 2026-05-28
- **"Psy-Mono" Pipeline Upgrade.**
- Implemented Euclidean Gating for algorithmic leads in \`PsyGenerator\`.
- Refined Psytrance rolling bass variants (Classic, Triplet, Rolling).
- Upgraded \`HouseStructuralQuantizer.py\` with rigid 124 BPM grid-locking.

## [1.4.2] - 2026-05-28
- Minor stabilization and registry indexing fixes.

## [1.0.0] - 2026-05-27
- **V1.0.0 Milestone Release: The Autonomous Production Engine.**
- Fully integrated 145 BPM Psytrance and 124 BPM Deep House algorithmic generators.
