import { MidiParser } from "../src/analysis/midi_parser";
import { PsyGenerator, DEFAULT_PSY_CONFIG } from "../src/sequencer/psy_generator";
import * as fs from "fs";
import * as path from "path";

describe("Psytrance Pipeline Tests", () => {
    const testMidi = "hymnmania_src/hymn_remaker/test_input/Emmanuel.mid";

    test("MidiParser should extract DNA from hymn MIDI", () => {
        const dna = MidiParser.parse(testMidi);
        expect(dna.bpm).toBeDefined();
        expect(dna.melody.length).toBeGreaterThan(0);
        expect(dna.harmony.length).toBeGreaterThan(0);
    });

    test("PsyGenerator should preserve note intervals of the melody", () => {
        const dna = MidiParser.parse(testMidi);
        const psyMidi = PsyGenerator.generate(dna, DEFAULT_PSY_CONFIG);

        const leadTrack = psyMidi.tracks.find(t => t.name === "Lead Arp");
        expect(leadTrack).toBeDefined();

        if (leadTrack) {
            // Check that notes in lead track correspond to melody notes
            const melodyMidiNotes = new Set(dna.melody.map(m => m.note));
            leadTrack.notes.forEach(note => {
                expect(melodyMidiNotes.has(note.midi)).toBe(true);
            });
        }
    });

    test("PsyGenerator should align to 145 BPM grid", () => {
        const dna = MidiParser.parse(testMidi);
        const targetBpm = 145;
        const psyMidi = PsyGenerator.generate(dna, { ...DEFAULT_PSY_CONFIG, targetBpm });

        expect(psyMidi.header.tempos[0].bpm).toBe(targetBpm);

        const sixteenth = 60 / targetBpm / 4;
        const kickTrack = psyMidi.tracks.find(t => t.name === "Kick");

        if (kickTrack) {
            kickTrack.notes.forEach((note, i) => {
                // Kick should be on every quarter note
                const expectedTime = i * (60 / targetBpm);
                expect(note.time).toBeCloseTo(expectedTime, 5);
            });
        }
    });
});
