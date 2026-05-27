import sys
import os
from pedalboard import Pedalboard, Compressor, Gain, Reverb, HighpassFilter, LowpassFilter
from pedalboard.io import AudioFile

def enhance_audio(input_path, output_path):
    try:
        with AudioFile(input_path) as f:
            audio = f.read(f.frames)
            samplerate = f.samplerate

        # Define the 'Sonic Vacuum' effect chain
        # 1. Clean low end
        # 2. Compress for consistency
        # 3. Add slight space
        # 4. Boost gain
        board = Pedalboard([
            HighpassFilter(cutoff_frequency_hz=30),
            Compressor(threshold_db=-12, ratio=4),
            Reverb(room_size=0.1, dry_level=0.9, wet_level=0.1),
            Gain(gain_db=3)
        ])

        effected = board(audio, samplerate)

        with AudioFile(output_path, 'w', samplerate, effected.shape[0]) as f:
            f.write(effected)

        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    enhance_audio(sys.argv[1], sys.argv[2])
