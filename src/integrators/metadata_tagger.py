import sys
import os
import json
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TYER, TCON, TBPM, TXXX
from mutagen.wave import WAVE

def tag_audio(file_path, metadata):
    try:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        audio = WAVE(file_path)
        if audio.tags is None:
            audio.add_tags()

        tags = audio.tags

        # Mapping metadata to ID3 tags
        tags.add(TIT2(encoding=3, text=metadata.get('title', 'Untitled')))
        tags.add(TPE1(encoding=3, text=metadata.get('artist', 'Hymnmania AI')))
        tags.add(TALB(encoding=3, text=metadata.get('album', 'Psy-Mono Collection')))
        tags.add(TYER(encoding=3, text=metadata.get('year', '2026')))
        tags.add(TCON(encoding=3, text=metadata.get('genre', 'Psytrance')))
        tags.add(TBPM(encoding=3, text=str(metadata.get('bpm', '145'))))

        # Custom tags for Key and Version
        tags.add(TXXX(encoding=3, desc='Musical Key', text=metadata.get('key', 'Unknown')))
        tags.add(TXXX(encoding=3, desc='Pipeline Version', text=metadata.get('version', '0.5.0')))

        audio.save()
        return {"success": True, "file": file_path}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python tagger.py <file_path> <metadata_json>"}))
        sys.exit(1)

    file_path = sys.argv[1]
    metadata = json.loads(sys.argv[2])

    result = tag_audio(file_path, metadata)
    print(json.dumps(result))
