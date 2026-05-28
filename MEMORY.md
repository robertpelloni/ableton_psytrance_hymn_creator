# MEMORY

## Versioning
- **Version 1.5.0**: Introduction of the "Psy-Mono" pipeline. Features Euclidean gating, rolling bass variants, and automated vocal harmonic alignment.
- **Version 1.0.0**: Marks the completion of the core autonomous pipeline.

## Architectural Observations
- Transitioned to a "Psy-Mono" pipeline: Algorithmic structure (Phase 2) -> Neural Texture Mapping (Phase 3).
- Uses TypeScript for orchestration and MIDI manipulation, and Python for advanced DSP (librosa, demucs, mido).
- House production uses a deterministic structural quantizer for rigid grid-locking.

## Codebase Traits
- **Psytrance**: Strict 145 BPM, 16th-note rolling bass (K-B-B-B), Euclidean gated leads.
- **House**: Strict 124 BPM, 16th-note quantization, automated 4/4 kick, syncopated off-beat bass.
- **Vocal Remix**: Automatic BPM detection, ratio-based time-stretching, and semitone-aware pitch shifting.

## Design Preferences
- Modular Domain-Driven Design: Analysis, Sequencer, Rendering, Integrators.
- Headless execution for cloud-scale autonomous production.
