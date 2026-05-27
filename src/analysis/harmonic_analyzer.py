import sys
import json
from music21 import converter, chord

def analyze_midi(file_path):
    try:
        s = converter.parse(file_path)
        chords = []

        # Extract chords and their timing
        for el in s.flatten().getElementsByClass(chord.Chord):
            chords.append({
                'time': float(el.offset),
                'duration': float(el.duration.quarterLength),
                'notes': [n.pitch.ps for n in el],
                'root': float(el.root().ps),
                'common_name': el.commonName
            })

        # If no chords were found (e.g. monophonic tracks), try to find notes
        if not chords:
            from music21 import note
            for el in s.flatten().getElementsByClass(note.Note):
                 chords.append({
                    'time': float(el.offset),
                    'duration': float(el.duration.quarterLength),
                    'notes': [el.pitch.ps],
                    'root': float(el.pitch.ps),
                    'common_name': el.name
                })

        return {
            'chords': chords,
            'key': str(s.analyze('key')),
            'metadata': {
                'title': s.metadata.title if s.metadata else "Untitled"
            }
        }
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)

    result = analyze_midi(sys.argv[1])
    print(json.dumps(result))
