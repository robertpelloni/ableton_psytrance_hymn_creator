import * as fs from "fs";
import * as path from "path";
import { Midi } from "@tonejs/midi";

export interface HouseConfig {
    targetBpm: number;
    swing: number;
    kickVelocity: number;
    bassVelocity: number;
}

export const DEFAULT_HOUSE_CONFIG: HouseConfig = {
    targetBpm: 124,
    swing: 0.0,
    kickVelocity: 0.9,
    bassVelocity: 0.8
};

export class HouseGenerator {
    static generate(inputMidiPath: string, config: HouseConfig = DEFAULT_HOUSE_CONFIG): Midi {
        if (!fs.existsSync(inputMidiPath)) {
            throw new Error(`Input MIDI file not found: ${inputMidiPath}`);
        }

        const inputBuffer = fs.readFileSync(inputMidiPath);
        const inputMidi = new Midi(inputBuffer);
        const outputMidi = new Midi();

        // Step 1: Set Tempo
        outputMidi.header.setTempo(config.targetBpm);
        outputMidi.header.name = "House Skeleton";

        const ticksPerBeat = outputMidi.header.ppq;
        const sixteenthQuantum = ticksPerBeat / 4;
        const eighthQuantum = ticksPerBeat / 2;

        let totalDurationTicks = 0;
        const bassNotes: any[] = [];

        // Step 2: Quantize and Extract DNA
        inputMidi.tracks.forEach((track, i) => {
            const isBassTrack = track.name.toLowerCase().includes("bass");
            const newTrack = outputMidi.addTrack();
            newTrack.name = `${track.name} (Quantized)`;

            track.notes.forEach(note => {
                // Quantize start and duration
                const quantizedStart = Math.round(note.ticks / sixteenthQuantum) * sixteenthQuantum;
                const quantizedEnd = Math.round((note.ticks + note.durationTicks) / sixteenthQuantum) * sixteenthQuantum;
                const quantizedDuration = Math.max(sixteenthQuantum, quantizedEnd - quantizedStart);

                if (!isBassTrack && note.midi >= 50) {
                    newTrack.addNote({
                        midi: note.midi,
                        ticks: quantizedStart,
                        durationTicks: quantizedDuration,
                        velocity: note.velocity
                    });
                }

                if (quantizedStart + quantizedDuration > totalDurationTicks) {
                    totalDurationTicks = quantizedStart + quantizedDuration;
                }

                if (isBassTrack || note.midi < 50) {
                    bassNotes.push({
                        midi: note.midi,
                        ticks: quantizedStart,
                        durationTicks: quantizedDuration,
                        velocity: note.velocity
                    });
                }
            });
        });

        // Step 3: Four-on-the-Floor Kick (Channel 10)
        const kickTrack = outputMidi.addTrack();
        kickTrack.name = "House Kick Drum";
        const kickNote = 36; // C1
        const kickDuration = Math.round(ticksPerBeat * 0.8);

        for (let tick = 0; tick < totalDurationTicks; tick += ticksPerBeat) {
            const note = kickTrack.addNote({
                midi: kickNote,
                ticks: tick,
                durationTicks: kickDuration,
                velocity: config.kickVelocity
            });
            // @ts-ignore
            note.channel = 9; // MIDI channel 10
        }

        // Step 4: Off-Beat Bass Shifter
        if (bassNotes.length > 0) {
            const bassTrack = outputMidi.addTrack();
            bassTrack.name = "Off-Beat House Bass";

            // Sort by time
            bassNotes.sort((a, b) => a.ticks - b.ticks);

            bassNotes.forEach(note => {
                const beatStart = Math.floor(note.ticks / ticksPerBeat) * ticksPerBeat;
                const swingTicks = Math.round(eighthQuantum * config.swing * 0.33);

                // Force to the nearest 8th note off-beat
                const offBeatStart = beatStart + eighthQuantum + swingTicks;

                bassTrack.addNote({
                    midi: note.midi,
                    ticks: offBeatStart,
                    durationTicks: sixteenthQuantum, // Staccato
                    velocity: config.bassVelocity
                });
            });
        }

        return outputMidi;
    }

    static saveMidi(midi: Midi, outputPath: string) {
        fs.writeFileSync(outputPath, Buffer.from(midi.toArray()));
    }
}
