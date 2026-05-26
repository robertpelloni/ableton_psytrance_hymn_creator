# MEMORY

## Architectural Observations
- The project is transitioning from a manual DAW-based workflow to a programmatic "Psy-Mono" pipeline.
- It uses a hybrid approach: TypeScript for orchestration and MIDI manipulation, and Python for advanced audio processing (librosa, demucs).
- The pipeline is modular: Analysis -> Sequencer -> Rendering -> Integration.

## Codebase Traits
- **Strict Quantization**: 145 BPM for Psytrance, 124 BPM for House.
- **Euclidean Gating**: Used for transforming sustained hymn melodies into rhythmic leads.
- **Rolling Bass**: Classic psytrance 3-note gallop pattern.

## Design Preferences
- TypeScript for type-safe orchestration.
- Python for DSP and AI model interaction.
- Headless execution for cloud deployments.
