"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const midi_parser_1 = require("../src/analysis/midi_parser");
const psy_generator_1 = require("../src/sequencer/psy_generator");
describe("Psytrance Pipeline Tests", () => {
    const testMidi = "hymnmania_src/hymn_remaker/test_input/Emmanuel.mid";
    test("MidiParser should extract DNA from hymn MIDI", () => {
        const dna = midi_parser_1.MidiParser.parse(testMidi);
        expect(dna.bpm).toBeDefined();
        expect(dna.melody.length).toBeGreaterThan(0);
        expect(dna.harmony.length).toBeGreaterThan(0);
    });
    test("PsyGenerator should preserve note intervals of the melody", () => {
        const dna = midi_parser_1.MidiParser.parse(testMidi);
        const psyMidi = psy_generator_1.PsyGenerator.generate(dna, psy_generator_1.DEFAULT_PSY_CONFIG);
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
        const dna = midi_parser_1.MidiParser.parse(testMidi);
        const targetBpm = 145;
        const psyMidi = psy_generator_1.PsyGenerator.generate(dna, { ...psy_generator_1.DEFAULT_PSY_CONFIG, targetBpm });
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
