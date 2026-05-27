import music21
import json
import os
import sys
import glob
from collections import defaultdict

def train_on_corpus(corpus_dir, output_path, feedback_path=None):
    # Transition matrices: current_note -> {next_note: count}
    melody_transitions = defaultdict(lambda: defaultdict(float))
    rhythm_transitions = defaultdict(lambda: defaultdict(float))

    feedback_data = []
    if feedback_path and os.path.exists(feedback_path):
        try:
            with open(feedback_path, 'r') as f:
                feedback_data = json.load(f)
        except:
            pass

    # Map MIDI filename (base) to weight
    weights = defaultdict(lambda: 1.0)
    for fb in feedback_data:
        # feedback.json has track fileName like "Published-Emmanuel-1.0.0-2026-05-27.wav"
        # We need to map this back to the original MIDI if possible,
        # or just weight patterns found in similar 'sounding' hymns.
        # For now, let's look for keywords in the filename.
        weight = 2.0 if fb.get('rating') == 'up' else 0.5
        # Store by part of filename to match corpus MIDIs
        name_part = fb.get('fileName', '').split('-')[1] if '-' in fb.get('fileName', '') else ''
        if name_part:
            weights[name_part.lower()] = weight

    midi_files = glob.glob(os.path.join(corpus_dir, "**/*.mid"), recursive=True)
    print(f"Analyzing {len(midi_files)} files...")

    for midi_file in midi_files:
        try:
            base_name = os.path.basename(midi_file).lower()
            weight = 1.0
            for k, v in weights.items():
                if k in base_name:
                    weight = v
                    break

            score = music21.converter.parse(midi_file)
            for part in score.parts:
                notes = part.flat.notes
                for i in range(len(notes) - 1):
                    n1 = notes[i]
                    n2 = notes[i+1]

                    if n1.isNote and n2.isNote:
                        # Melody (intervals)
                        interval = n2.pitch.midi - n1.pitch.midi
                        melody_transitions[n1.pitch.midi % 12][interval] += weight

                        # Rhythm (duration ratios)
                        d1 = float(n1.duration.quarterLength)
                        d2 = float(n2.duration.quarterLength)
                        if d1 > 0:
                            rhythm_transitions[str(d1)][str(d2)] += weight
        except Exception as e:
            continue

    # Normalize to probabilities
    def normalize(d):
        result = {}
        for k, v in d.items():
            total = sum(v.values())
            result[k] = {nk: nv/total for nk, nv in v.items()}
        return result

    model = {
        "melody": normalize(melody_transitions),
        "rhythm": normalize(rhythm_transitions),
        "version": "1.0.0"
    }

    with open(output_path, 'w') as f:
        json.dump(model, f, indent=2)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python style_modeler.py <corpus_dir> <output_path> [feedback_path]")
        sys.exit(1)

    feedback = sys.argv[3] if len(sys.argv) > 3 else None
    train_on_corpus(sys.argv[1], sys.argv[2], feedback)
