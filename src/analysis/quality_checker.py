import sys
import os
import json
import numpy as np
import librosa

def check_quality(audio_path):
    results = {
        "success": True,
        "clipping": False,
        "dc_offset": 0.0,
        "rms_db": -100.0,
        "peak_db": -100.0,
        "errors": []
    }

    if not os.path.exists(audio_path):
        results["success"] = False
        results["errors"].append(f"File not found: {audio_path}")
        return results

    try:
        y, sr = librosa.load(audio_path, sr=None)

        # 1. Check for Clipping
        peak = np.max(np.abs(y))
        results["peak_db"] = float(20 * np.log10(peak)) if peak > 0 else -100.0
        if peak >= 1.0:
            results["clipping"] = True
            results["errors"].append("Audio is clipping (peak >= 0dBFS)")

        # 2. Check DC Offset
        results["dc_offset"] = float(np.mean(y))
        if abs(results["dc_offset"]) > 0.01:
            results["errors"].append(f"High DC offset detected: {results['dc_offset']:.4f}")

        # 3. Check Loudness (RMS as simple proxy for LUFS)
        rms = np.sqrt(np.mean(y**2))
        results["rms_db"] = float(20 * np.log10(rms)) if rms > 0 else -100.0

        # Quality Gate thresholds
        if results["rms_db"] < -30.0:
             results["success"] = False
             results["errors"].append(f"Audio is too quiet ({results['rms_db']:.1f} dB RMS)")

    except Exception as e:
        results["success"] = False
        results["errors"].append(f"Analysis failed: {str(e)}")

    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "errors": ["No input file"]}))
        sys.exit(1)

    report = check_quality(sys.argv[1])
    print(json.dumps(report, indent=2))
