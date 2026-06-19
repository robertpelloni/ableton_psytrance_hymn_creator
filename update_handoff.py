with open('HANDOFF.md', 'r') as f:
    text = f.read()

text = text.replace('1.9.0', '1.10.0')

text = text.replace('## Accomplishments', '''## Accomplishments
1. **Expanded Genre Presets**: Added support for Peak Time Techno, Uplifting Trance, and Raw Hardstyle to the PromptEngine, Server, Pipeline, and UI.''')

text = text.replace('- **Headless Sound Design**', '''- **Headless Sound Design**''')

with open('HANDOFF.md', 'w') as f:
    f.write(text)
