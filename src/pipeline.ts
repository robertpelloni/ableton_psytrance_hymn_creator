import { MidiParser } from "./analysis/midi_parser";
import { PsyGenerator, PsyConfig, DEFAULT_PSY_CONFIG } from "./sequencer/psy_generator";
import { VocalProcessor } from "./integrators/vocal_processor";
import { AIBridge } from "./integrators/ai_bridge";
import * as fs from "fs";
import * as path from "path";

export interface PipelineOptions {
    inputMidi: string;
    outputDir: string;
    psyConfig?: PsyConfig;
    vocalTrack?: string;
    targetBpm?: number;
    aiPrompt?: string;
}

export class PsyMonoPipeline {
    async run(options: PipelineOptions) {
        const { inputMidi, outputDir, psyConfig = DEFAULT_PSY_CONFIG, vocalTrack, targetBpm = 145, aiPrompt } = options;

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`--- [Psy-Mono Pipeline] Starting ---`);

        // 1. Analysis
        console.log(`Step 1: Extracting DNA from ${path.basename(inputMidi)}...`);
        const dna = MidiParser.parse(inputMidi);

        // 2. Algorithmic Sequencing
        console.log(`Step 2: Generating procedural ${targetBpm} BPM patterns...`);
        const effectiveConfig = { ...psyConfig, targetBpm };
        const psyMidi = PsyGenerator.generate(dna, effectiveConfig);
        const finalMidiPath = path.join(outputDir, "psy_structure.mid");
        PsyGenerator.saveMidi(psyMidi, finalMidiPath);
        console.log(`MIDI saved to ${finalMidiPath}`);

        // 3. Optional Vocal Processing
        if (vocalTrack) {
            console.log(`Step 3: Processing vocal track ${vocalTrack}...`);
            const vocalProcessor = new VocalProcessor({
                mode: 'local',
                targetBpm: targetBpm,
                targetKey: dna.key
            });
            const processedVocalPath = await vocalProcessor.process(vocalTrack, path.join(outputDir, "vocal"));
            console.log(`Processed vocal saved to ${processedVocalPath}`);
        }

        // 4. Optional AI Overhaul
        if (aiPrompt) {
            console.log(`Step 4: Orchestrating AI Sound Design Overhaul...`);
            const aiBridge = new AIBridge({});
            const aiResult = await aiBridge.remakeWithAI(finalMidiPath.replace('.mid', '.wav'), aiPrompt);
            console.log(`AI Overhaul complete: ${aiResult}`);
        }

        console.log(`--- [Psy-Mono Pipeline] Finished ---`);
    }
}

// CLI Entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: ts-node src/pipeline.ts <input_midi> <output_dir> [--vocal <vocal_path>] [--bpm <bpm>]");
        process.exit(1);
    }

    const inputMidi = args[0];
    const outputDir = args[1];
    let vocalTrack: string | undefined;
    let targetBpm = 145;

    for (let i = 2; i < args.length; i++) {
        if (args[i] === "--vocal" && args[i+1]) {
            vocalTrack = args[i+1];
            i++;
        } else if (args[i] === "--bpm" && args[i+1]) {
            targetBpm = parseInt(args[i+1]);
            i++;
        }
    }

    const pipeline = new PsyMonoPipeline();
    pipeline.run({
        inputMidi,
        outputDir,
        vocalTrack,
        targetBpm,
        aiPrompt: "Modern Full-On Psytrance, 145 BPM, driving, psychedelic sound design, festival grade master"
    }).catch(console.error);
}
