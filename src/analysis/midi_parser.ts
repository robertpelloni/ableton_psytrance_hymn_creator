import { Midi } from "@tonejs/midi";
import * as fs from "fs";
import { spawnSync } from "child_process";
import * as path from "path";

export interface ChordDNA {
    time: number;
    duration: number;
    notes: number[];
    root: number;
    common_name: string;
}

export interface HymnDNA {
    title: string;
    bpm: number;
    key: string;
    melody: {
        time: number;
        duration: number;
        note: number;
        velocity: number;
    }[];
    harmony: {
        time: number;
        duration: number;
        note: number;
        velocity: number;
    }[];
    chords: ChordDNA[];
}

export class MidiParser {
    static parse(filePath: string): HymnDNA {
        const midiData = fs.readFileSync(filePath);
        const midi = new Midi(midiData);

        const dna: HymnDNA = {
            title: midi.name || "Untitled",
            bpm: midi.header.tempos[0]?.bpm || 120,
            key: midi.header.keySignatures[0]?.key || "C",
            melody: [],
            harmony: [],
            chords: []
        };

        const tracksWithNotes = midi.tracks.filter(t => t.notes.length > 0);

        if (tracksWithNotes.length > 0) {
            // Sort tracks by average pitch to identify melody (usually higher) and harmony/bass (usually lower)
            const sortedTracks = [...tracksWithNotes].sort((a, b) => {
                const avgA = a.notes.reduce((sum, n) => sum + n.midi, 0) / a.notes.length;
                const avgB = b.notes.reduce((sum, n) => sum + n.midi, 0) / b.notes.length;
                return avgB - avgA;
            });

            const melodyTrack = sortedTracks[0];
            dna.melody = melodyTrack.notes.map(n => ({
                time: n.time,
                duration: n.duration,
                note: n.midi,
                velocity: n.velocity
            }));

            // Use the lowest track for harmony/root notes
            const harmonyTrack = sortedTracks[sortedTracks.length - 1];
            dna.harmony = harmonyTrack.notes.map(n => ({
                time: n.time,
                duration: n.duration,
                note: n.midi,
                velocity: n.velocity
            }));
        }

        // Advanced Harmonic Analysis via Python music21
        const analyzerPath = path.join(__dirname, "harmonic_analyzer.py");
        const result = spawnSync("python3", [analyzerPath, filePath]);
        if (result.status === 0) {
            try {
                const analysis = JSON.parse(result.stdout.toString());
                if (!analysis.error) {
                    dna.chords = analysis.chords;
                    dna.key = analysis.key;
                    if (analysis.metadata && analysis.metadata.title) {
                        dna.title = analysis.metadata.title;
                    }
                }
            } catch (e) {
                console.error("Failed to parse harmonic analysis result:", e);
            }
        } else {
            console.error("Harmonic analyzer failed:", result.stderr.toString());
        }

        return dna;
    }
}
