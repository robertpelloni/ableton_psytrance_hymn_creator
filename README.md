# ableton_psytrance_hymn_creator — the "Hymnmania pipeline"

A TypeScript pipeline that takes classical hymn MIDI files and transforms them into psytrance (145 BPM) and deep house (124 BPM) tracks: parse the MIDI (`@tonejs/midi`), extract harmonic/melodic structure, re-sequence it into electronic frameworks, and render/stream the result.

Despite the repo name, **there is no Ableton Live integration in this tree**. The package inside is named `hymnmania-pipeline`.

## Status

**Active prototype, intermittently maintained.** Agent-developed (May–August 2026, Jules merges and "phase" feature commits), with maintenance commits continuing into November 2026. Not a released product — no releases, no published output tracks in the tree.

Last significant activity: **2026-11-12** — repository sync, retaining the HeadlessSuno fallback, fixing a Windows test spawn issue (v1.18.5).

## What's in here

- `src/pipeline.ts` — the pipeline core; `src/server.ts` — an Express 5 REST API for remote orchestration
- `src/analysis/`, `src/sequencer/`, `src/rendering/`, `src/services/`, `src/streaming/`, `src/integrators/` — pipeline stages, including the "Neural Mastering" / radio-streaming work from the July 2026 commits and FFmpeg-based audio-reactive visual generation (per `VISION.md`)
- `tests/` + `jest.config.js` — Jest/ts-jest test setup
- `public/`, `scripts/`, `pipeline/processing/` — dashboard assets and processing stages
- `hymnmania_src` — a git submodule pointer to the hymnmania material

## Known issues

- Both `package-lock.json` and `pnpm-lock.yaml` are committed; pick one package manager and delete the other.
- Housekeeping debris: `src/pipeline.ts.patch` and `src/pipeline.ts.rej` (leftover patch/reject files) are checked in.
- `VISION.md`'s status line disagrees with the package version.

## Running

```bash
npm install
npx tsc --noEmit        # typecheck
npm test                # jest
npx ts-node src/pipeline.ts
```

Python helpers (`requirements.txt`, `update_changelog.py`, `update_handoff.py`) support the repo's documentation automation.

## Related

- [hymnmania](https://github.com/robertpelloni/hymnmania) — the rhythm-game side of the hymn material
