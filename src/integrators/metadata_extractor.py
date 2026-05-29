import sys
import json
import os
import audio_metadata

def extract_metadata(file_path):
    try:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        metadata = audio_metadata.load(file_path)

        # Technical properties
        streaminfo = metadata.streaminfo
        technical = {
            "duration": float(streaminfo.duration),
            "bitrate": int(streaminfo.bitrate),
            "sample_rate": int(streaminfo.sample_rate),
            "channels": int(streaminfo.channels),
            "format": str(metadata.__class__.__name__).replace('Metadata', '').upper()
        }

        # Embedded tags
        tags = {}
        if hasattr(metadata, 'tags'):
            for key, value in metadata.tags.items():
                if isinstance(value, list):
                    tags[key] = str(value[0])
                else:
                    tags[key] = str(value)

        # Explicitly extract custom tags if present in ID3v2 usertext (TXXX)
        custom_tags = {}
        if hasattr(metadata, 'tags') and 'usertext' in metadata.tags:
            for item in metadata.tags['usertext']:
                if hasattr(item, 'description') and hasattr(item, 'text'):
                    desc = item.description
                    val = item.text[0] if isinstance(item.text, list) else item.text
                    custom_tags[desc] = val

        return {
            "success": True,
            "technical": technical,
            "tags": tags,
            "custom_tags": custom_tags,
            "file_size": os.path.getsize(file_path)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    result = extract_metadata(sys.argv[1])
    print(json.dumps(result))
