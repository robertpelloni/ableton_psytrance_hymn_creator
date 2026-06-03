# MEMORY

## Versioning
- **Version 1.7.1**: Automated Streaming Publishing. Catch-up sync for YouTube/Soundcloud.
- **Version 1.7.0**: REST API for remote orchestration. Asynchronous production triggering.
- **Version 1.6.2**: Local MusicGen inference layer. High-fidelity neural texture mapping.
- **Version 1.6.1**: Autonomous Vault Sync & Repo Sanitization Protocol.
- **Version 1.6.0**: Unified TypeScript architecture. Implemented audio-reactive video generation. Ported House Structural Quantizer to TypeScript.

## Architectural Observations
- The project has successfully unified its core music generation logic into TypeScript (`PsyGenerator` and `HouseGenerator`).
- Visual generation has moved from static images to dynamic audio-reactive visuals using FFmpeg complex filters.
- Orchestration is centralized in `scripts/autonomous_production.ts` for simple end-to-end execution.
- REST API provides a programmatic gateway for remote production management.

## Codebase Traits
- **Unified Pipeline**: TypeScript-first MIDI manipulation and orchestration.
- **FFmpeg Visualization**: showwaves and avectorscope for dynamic video output.
- **REST API**: Express-based server for asynchronous job triggering.
- **Robustness**: Quality gates, automated archiving, and vault synchronization are standard.

## Design Preferences
- Modular Domain-Driven Design: Analysis, Sequencer, Rendering, Integrators.
- Simplified "one-command" autonomous entry points.
- Continuous Autonomous Execution: Automated git commits for versioning and registry updates.
