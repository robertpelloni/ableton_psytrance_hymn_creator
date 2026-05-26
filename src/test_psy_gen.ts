import { MidiParser } from "./analysis/midi_parser";
import { PsyGenerator } from "./sequencer/psy_generator";
import * as path from "path";
import * as fs from "fs";

async function test() {
    const inputMidi = "hymnmania_src/hymn_remaker/test_input/Emmanuel.mid";
    const outputDir = "pipeline/output/psy_test";

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("Parsing MIDI...");
    const dna = MidiParser.parse(inputMidi);
    console.log(`DNA Extracted: ${dna.title}, BPM: ${dna.bpm}`);

    console.log("Generating Psytrance...");
    const psyMidi = PsyGenerator.generate(dna);

    const outputPath = path.join(outputDir, "psy_emmanuel.mid");
    PsyGenerator.saveMidi(psyMidi, outputPath);
    console.log(`Saved to ${outputPath}`);
}

test().catch(console.error);
