# MEMORY

## Versioning
- **Version 1.6.0**: Unified TypeScript architecture. Implemented audio-reactive video generation. Ported House Structural Quantizer to TypeScript.
- **Version 1.5.0**: Introduction of the "Psy-Mono" pipeline. Features Euclidean gating and rolling bass variants.

## Architectural Observations
- The project has successfully unified its core music generation logic into TypeScript (\`PsyGenerator\` and \`HouseGenerator\`).
- Visual generation has moved from static images to dynamic audio-reactive visuals using FFmpeg complex filters.
- Orchestration is centralized in \`scripts/autonomous_production.ts\` for simple end-to-end execution.

## Codebase Traits
- **Unified Pipeline**: TypeScript-first MIDI manipulation and orchestration.
- **FFmpeg Visualization**: showwaves and avectorscope for dynamic video output.
- **Robustness**: Quality gates and automated archiving are standard in every production run.

## Design Preferences
- Modular Domain-Driven Design: Analysis, Sequencer, Rendering, Integrators.
- Simplified "one-command" autonomous entry points.
