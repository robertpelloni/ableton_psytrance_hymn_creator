import sys
from datetime import datetime

with open('CHANGELOG.md', 'r') as f:
    lines = f.readlines()

new_entry = f"""## [1.10.0] - {datetime.now().strftime('%Y-%m-%d')}
- **Expanded Genre Presets (Techno, Trance, Hardstyle).**
- Added support for Peak Time Techno (130 BPM), Uplifting Trance (138 BPM), and Raw Hardstyle (150 BPM).
- Updated `PromptEngine` to generate specific AI sound design prompts for each new genre.
- Updated `PipelineOptions` and `PsyMonoPipeline` to support the new `SupportedGenre` typing and appropriately set uppercase names in track metadata.
- Updated the REST API server to assign correct default BPMs based on the selected genre.
- Updated the Web UI dropdowns to include the newly added genres.

"""

lines.insert(2, new_entry)

with open('CHANGELOG.md', 'w') as f:
    f.writelines(lines)
