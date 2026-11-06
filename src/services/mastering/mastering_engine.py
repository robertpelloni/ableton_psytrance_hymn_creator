import sys
import os
import subprocess
import json
import matchering as mg

def master_audio(input_path, output_path, target_lufs=-7.0):
    """
    Apply neural mastering using Matchering (EQ/dynamics match),
    followed by FFmpeg's dual-pass loudnorm to guarantee exact LUFS.
    """
    reference_path = "./public/registry/2026/05/28/Archive-canary-1.0.0-2026-05-28.wav"
    matchering_output = input_path.replace(".wav", "_matched.wav")

    print(f"Step 1: Matchering EQ & Dynamics...")
    print(f"  Target: {input_path}")
    print(f"  Reference: {reference_path}")

    try:
        mg.process(
            target=input_path,
            reference=reference_path,
            results=[mg.pcm16(matchering_output)]
        )
    except Exception as e:
        print(f"Matchering failed, skipping to loudnorm. Error: {e}")
        matchering_output = input_path

    print(f"Step 2: FFmpeg Dual-Pass Loudnorm (Target: {target_lufs} LUFS)")

    # 1. First pass for analysis
    analysis_cmd = [
        "ffmpeg", "-i", matchering_output,
        "-af", f"loudnorm=I={target_lufs}:TP=-1.0:LRA=11:print_format=json",
        "-f", "null", "-"
    ]

    try:
        result = subprocess.run(analysis_cmd, capture_output=True, text=True)
        # Extract the JSON block from stderr
        lines = result.stderr.split('\n')
        json_start = -1
        for i, line in enumerate(lines):
            if '{' in line and 'input_i' in line:
                json_start = i
                break

        if json_start == -1:
            print("Loudnorm analysis failed, using single pass.")
            cmd = ["ffmpeg", "-y", "-i", matchering_output, "-af", f"loudnorm=I={target_lufs}:TP=-1.0:LRA=11", output_path]
        else:
            stats = json.loads('\n'.join(lines[json_start:]))
            # 2. Second pass for high-fidelity normalization
            loudnorm_filter = (
                f"loudnorm=I={target_lufs}:TP=-1.0:LRA=11:"
                f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                f"offset={stats['target_offset']}"
            )
            cmd = ["ffmpeg", "-y", "-i", matchering_output, "-af", loudnorm_filter, output_path]

        subprocess.run(cmd, check=True)

        if matchering_output != input_path and os.path.exists(matchering_output):
            os.remove(matchering_output)

        return True
    except Exception as e:
        print(f"Mastering failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python mastering_engine.py <input> <output> [target_lufs]")
        sys.exit(1)

    input_wav = sys.argv[1]
    output_wav = sys.argv[2]
    lufs = float(sys.argv[3]) if len(sys.argv) > 3 else -7.0

    if master_audio(input_wav, output_wav, lufs):
        sys.exit(0)
    else:
        sys.exit(1)
