import music21
import json
import os
import sys
import glob
from collections import defaultdict

def train_on_corpus(corpus_dir, output_path):
    # Transition matrices: current_note -> {next_note: count}
    melody_transitions = defaultdict(lambda: defaultdict(int))
    rhythm_transitions = defaultdict(lambda: defaultdict(int))

    midi_files = glob.glob(os.path.join(corpus_dir, "**/*.mid"), recursive=True)
    print(f"Analyzing {len(midi_files)} files...")

    for midi_file in midi_files:
        try:
            score = music21.converter.parse(midi_file)
            for part in score.parts:
                notes = part.flat.notes
                for i in range(len(notes) - 1):
                    n1 = notes[i]
                    n2 = notes[i+1]

                    if n1.isNote and n2.isNote:
                        # Melody (intervals)
                        interval = n2.pitch.midi - n1.pitch.midi
                        melody_transitions[n1.pitch.midi % 12][interval] += 1

                        # Rhythm (duration ratios)
                        d1 = float(n1.duration.quarterLength)
                        d2 = float(n2.duration.quarterLength)
                        if d1 > 0:
                            rhythm_transitions[str(d1)][str(d2)] += 1
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
        print("Usage: python style_modeler.py <corpus_dir> <output_path>")
        sys.exit(1)
    train_on_corpus(sys.argv[1], sys.argv[2])
