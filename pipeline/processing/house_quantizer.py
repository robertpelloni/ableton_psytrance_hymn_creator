import os
import mido
from mido import MidiFile, MidiTrack, MetaMessage, Message

class HouseStructuralQuantizer:
    def __init__(self, midi_path: str):
        """
        Initializes the quantizer with the path to a classical hymn MIDI file.
        """
        if not os.path.exists(midi_path):
            raise FileNotFoundError(f"Input MIDI file not found at: {midi_path}")
        self.midi_path = midi_path
        self.mid = MidiFile(midi_path)
        self.ticks_per_beat = self.mid.ticks_per_beat

    def quantize_value(self, ticks: int, quantum: int) -> int:
        """
        Snaps a tick value to the nearest grid quantum (e.g., 16th note).
        """
        return round(ticks / quantum) * quantum

    def process(self, target_bpm: int = 124, output_dir: str = "pipeline/output/house_skeletons/", swing: float = 0.0) -> str:
        """
        Executes the structural house shift pipeline:
        1. Forces strict house tempo metadata.
        2. Quantizes all note events to a rigid 16th-note grid.
        3. Automates a four-on-the-floor kick drum pattern.
        4. Isolates and shifts the bass track to the syncopated off-beats.
        """
        out_mid = MidiFile(ticks_per_beat=self.ticks_per_beat)

        # Calculate grid resolutions in ticks
        # 1 quarter note = ticks_per_beat
        # 1 16th note = ticks_per_beat / 4
        sixteenth_quantum = round(self.ticks_per_beat / 4)
        eighth_quantum = round(self.ticks_per_beat / 2)

        # ---------------------------------------------------------
        # Step 1: Create Master Track & Enforce Tempo (124/126 BPM)
        # ---------------------------------------------------------
        master_track = MidiTrack()
        out_mid.tracks.append(master_track)

        # Convert BPM to microseconds per beat
        tempo_microseconds = mido.bpm2tempo(target_bpm)
        master_track.append(MetaMessage('set_tempo', tempo=tempo_microseconds, time=0))
        master_track.append(MetaMessage('track_name', name='Master / Tempo', time=0))

        total_duration_ticks = 0
        bass_notes = []

        # ---------------------------------------------------------
        # Step 2: Parse, Quantize, and Track Extraction
        # ---------------------------------------------------------
        for i, track in enumerate(self.mid.tracks):
            new_track = MidiTrack()
            track_name = f"Quantized Track {i}"

            # Keep track of absolute timeline positions to safely quantize
            abs_time = 0
            new_abs_time = 0

            # Track notes for potential bass extraction (lowest channel/notes or specific tracks)
            # For robustness, we search for low register pitches (< 50) to treat as the bass elements
            is_bass_track = False
            for msg in track:
                if msg.is_meta and msg.type == 'track_name':
                    if 'bass' in msg.name.lower():
                        is_bass_track = True
                        break

            for msg in track:
                abs_time += msg.time

                if msg.is_meta:
                    if msg.type == 'track_name':
                        track_name = msg.name
                    # Skip original tempo changes to prevent conflicts
                    if msg.type == 'set_tempo':
                        continue
                    new_track.append(msg.copy(time=0))

                elif msg.type in ['note_on', 'note_off']:
                    # Force grid quantization on absolute timeline position
                    quantized_abs_time = self.quantize_value(abs_time, sixteenth_quantum)
                    delta_time = max(0, quantized_abs_time - new_abs_time)
                    new_abs_time = quantized_abs_time

                    quantized_msg = msg.copy(time=delta_time)
                    new_track.append(quantized_msg)

                    # Track total length of the piece for the automation engines
                    if quantized_abs_time > total_duration_ticks:
                        total_duration_ticks = quantized_abs_time

                    # Extract bass track data for Step 4
                    if is_bass_track or (msg.type == 'note_on' and msg.note < 50):
                        bass_notes.append({
                            'type': msg.type,
                            'note': msg.note,
                            'velocity': msg.velocity,
                            'abs_time': quantized_abs_time
                        })

            if len(new_track) > 0 and not is_bass_track:
                new_track.name = f"{track_name} (Quantized)"
                out_mid.tracks.append(new_track)

        # ---------------------------------------------------------
        # Step 3: Four-on-the-Floor Automation Track (Channel 10)
        # ---------------------------------------------------------
        kick_track = MidiTrack()
        kick_track.name = "House Kick Drum (Automated)"
        out_mid.tracks.append(kick_track)

        # Quarter-note loop parameters
        kick_note = 36  # Standard GM Bass Drum
        kick_velocity = 110
        kick_duration = round(self.ticks_per_beat * 0.8) # Punchy, tight length

        current_kick_tick = 0
        last_kick_event_tick = 0

        while current_kick_tick < total_duration_ticks:
            # Note On
            kick_track.append(Message('note_on', channel=9, note=kick_note, velocity=kick_velocity, time=current_kick_tick - last_kick_event_tick))
            last_kick_event_tick = current_kick_tick

            # Note Off
            current_kick_tick += kick_duration
            kick_track.append(Message('note_off', channel=9, note=kick_note, velocity=0, time=current_kick_tick - last_kick_event_tick))
            last_kick_event_tick = current_kick_tick

            # Step forward to the next quarter note beat
            current_kick_tick += (self.ticks_per_beat - kick_duration)

        # ---------------------------------------------------------
        # Step 4: The Off-Beat Bass Shifter
        # ---------------------------------------------------------
        if bass_notes:
            bass_track = MidiTrack()
            bass_track.name = "Off-Beat House Bass"
            out_mid.tracks.append(bass_track)

            last_bass_event_tick = 0

            # Sort events chronologically
            bass_notes = sorted(bass_notes, key=lambda x: x['abs_time'])

            for event in bass_notes:
                # Force off-beat shift: snap to the closest 8th-note offbeat ('the AND')
                # An offbeat occurs at odd multiples of half-beats (ticks_per_beat / 2)
                current_abs = event['abs_time']
                remainder = current_abs % self.ticks_per_beat

                # Apply swing if requested (shifts off-beats forward)
                # swing 0.0 to 1.0 (0.1 is subtle, 0.5 is heavy)
                swing_ticks = round(eighth_quantum * swing * 0.33)

                # Force placement directly onto the syncopated 8th note interval
                forced_abs = (current_abs - remainder) + eighth_quantum + swing_ticks
                if remainder > eighth_quantum:
                    forced_abs += self.ticks_per_beat

                # Clamp note off events to ensure staccato lengths (16th note duration)
                if event['type'] == 'note_off' or (event['type'] == 'note_on' and event['velocity'] == 0):
                    forced_abs += sixteenth_quantum
                    velocity = 0
                else:
                    velocity = event['velocity']

                delta_time = max(0, forced_abs - last_bass_event_tick)
                last_bass_event_tick = forced_abs

                bass_track.append(Message(
                    'note_on' if velocity > 0 else 'note_off',
                    channel=0, # Bass synth channel
                    note=event['note'],
                    velocity=velocity,
                    time=delta_time
                ))

        # Ensure output infrastructure directory exists
        os.makedirs(output_dir, exist_ok=True)
        base_name = os.path.basename(self.midi_path)
        output_path = os.path.join(output_dir, f"house_skeleton_{base_name}")

        out_mid.save(output_path)
        return output_path

# Quick test execution block
if __name__ == "__main__":
    import sys
    # Point this to an actual hymn MIDI path during automation pipeline execution
    test_file = sys.argv[1] if len(sys.argv) > 1 else "hymnmania_src/test_input/Emmanuel.mid"
    swing_val = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
    if os.path.exists(test_file):
        quantizer = HouseStructuralQuantizer(test_file)
        saved_file = quantizer.process(target_bpm=124, swing=swing_val)
        print(f"Successfully rendered structural house skeleton to: {saved_file}")
    else:
        print(f"Test file not found: {test_file}")
