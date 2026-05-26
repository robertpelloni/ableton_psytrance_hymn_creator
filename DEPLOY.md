# DEPLOYMENT

## Environment Setup
1. **Node.js**: Requires Node.js 18+.
2. **Python**: Requires Python 3.10+ with `pip`.
3. **FFmpeg**: Required for audio processing and time-stretching.
4. **External Tools**: `yt-dlp` for audio downloading.

## Installation
```bash
npm install
pip install -r requirements.txt
```

## Configuration
- `LALAL_API_KEY`: Required if using LALAL.AI for stem separation.
- `UDIO_TOKEN` / `SUNO_COOKIE`: Required for AI sound design integrations.

## Execution
```bash
ts-node src/pipeline.ts <input_midi> <output_dir>
```
