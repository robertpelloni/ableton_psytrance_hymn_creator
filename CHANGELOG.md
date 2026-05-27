# CHANGELOG

## [1.0.0] - 2026-05-27
- **V1.0.0 Milestone Release: The Autonomous Production Engine.**
- Fully integrated 145 BPM Psytrance and 124 BPM Deep House algorithmic generators.
- Advanced harmonic analysis using `music21` for chord-aware composition.
- Neural stem separation and harmonic grid-locking for hip-hop vocal remixes.
- Multi-stage audio pipeline with FluidSynth rendering and Pedalboard DSP enhancement.
- Automated publishing registry with ID3 tagging and manifest tracking.
- Interactive Dark-Mode Web UI with live GitHub Actions monitoring.
- Enterprise-grade CI/CD for scheduled daily autonomous production.

## [0.9.0] - 2026-05-27
### Added
- Automated technical metadata extraction using `audio-metadata`.
- Versioned registry and archive system for long-term track management.
- Detailed JSON sidecars for all published assets.
- UI enhancements to display technical audio properties.

## [0.8.0] - 2026-05-27
### Added
- Continuous music generation trigger using GitHub Actions `schedule`.
- Automated random MIDI selection for continuous production.
- UI enhancements for continuous mode control and randomized selection.
- Refined orchestration with explicit `glob` dependency for file discovery.

## [0.7.0] - 2026-05-27
### Added
- Local audio rendering using FluidSynth and high-quality soundfonts.
- Multi-track stem rendering (Kick, Bass, Lead) for neural texture mapping.
- "Sonic Vacuum" audio enhancement script using `pedalboard`.
- Automated production workflow with system-level dependencies (FluidSynth).

## [0.6.0] - 2026-05-27
### Added
- Real-time job triggering and monitoring in the Web UI via GitHub API.
- Integration of `HouseStructuralQuantizer` into the main TypeScript pipeline.
- GitHub Action support for target genre selection.
- Refined genre-specific AI prompting logic.

## [0.5.0] - 2026-05-27
### Added
- Automated metadata tagging system using `mutagen`.
- Track versioning and publishing system with `manifest.json`.
- UI updates to display and download published tracks.
- CI/CD workflow optimizations to prevent infinite loops and track published assets.

## [0.4.0] - 2026-05-27
### Added
- Advanced Harmonic Analysis using `music21` in `src/analysis/harmonic_analyzer.py`.
- Chord-aware bassline and arpeggiator generation in `PsyGenerator`.
- Updated CI/CD workflow to allow tracking of latest generated assets.

## [0.3.0] - 2026-05-27
### Added
- 2022-2023 Season Retrospective and 2023-2024 Season Forecast.
- Neural Overhaul roadmap in ROADMAP.md.
- Updated TODO.md with aggressive neural integration milestones.

### Changed
- Refined project strategy and documentation.
- Bumped version to 0.3.0.

## [0.2.0] - 2026-05-27
### Added
- Robust algorithmic composition for House (124 BPM) and Psytrance (145 BPM).
- Advanced vocal remixing with separation, time-stretching, and pitch-shifting.
- Continuous Deployment (CD) workflow for automated track generation and UI hosting.
- A modern web-based control panel for pipeline orchestration.
- Scoped repository initialization with correct submodules.
