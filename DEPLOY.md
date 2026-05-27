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

## UI Real-Time Integration
To enable triggering production jobs directly from the web UI:
1. Open the UI (hosted on GitHub Pages or locally via `public/index.html`).
2. Scroll to **GitHub Integration Settings**.
3. Enter your GitHub **Owner** (username) and **Repo** name.
4. Generate a **GitHub Personal Access Token (classic)** with `workflow` and `repo` scopes.
5. Save the settings. The UI will now use the GitHub API to dispatch and monitor jobs.
