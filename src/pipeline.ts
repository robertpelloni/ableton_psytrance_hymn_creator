import { MidiParser } from "./analysis/midi_parser";
import { PsyGenerator, PsyConfig, DEFAULT_PSY_CONFIG } from "./sequencer/psy_generator";
import { VocalProcessor } from "./integrators/vocal_processor";
import { AIBridge } from "./integrators/ai_bridge";
import { TrackManager } from "./integrators/track_manager";
import { RenderingModule } from "./rendering/renderer";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import { spawnSync } from "child_process";

export interface PipelineOptions {
    inputMidi?: string;
    outputDir: string;
    psyConfig?: PsyConfig;
    vocalTrack?: string;
    targetBpm?: number;
    aiPrompt?: string;
    genre?: "psytrance" | "house";
    continuous?: boolean;
}

export class PsyMonoPipeline {
    private renderer: RenderingModule;

    constructor() {
        this.renderer = new RenderingModule();
    }

    private getRandomMidi(): string {
        const files = glob.sync("hymnmania_src/**/*.mid");
        if (files.length === 0) throw new Error("No MIDI files found in hymnmania_src");
        return files[Math.floor(Math.random() * files.length)];
    }

    async run(options: PipelineOptions) {
        let { inputMidi, outputDir, psyConfig = DEFAULT_PSY_CONFIG, vocalTrack, targetBpm = 145, aiPrompt, genre = "psytrance", continuous = false } = options;

        if (continuous || !inputMidi) {
            console.log("Continuous mode active. Selecting random MIDI...");
            inputMidi = this.getRandomMidi();
        }

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`--- [Psy-Mono Pipeline] Starting ---`);

        // 1. Analysis
        console.log(`Step 1: Extracting DNA from ${path.basename(inputMidi)}...`);
        const dna = MidiParser.parse(inputMidi);

        // 2. Algorithmic Sequencing
        let finalMidiPath = path.join(outputDir, "structure.mid");
        if (genre === "house") {
            console.log(`Step 2: Generating procedural ${targetBpm} BPM House skeleton...`);
            const quantizerPath = path.join(__dirname, "../pipeline/processing/house_quantizer.py");
            const result = spawnSync("python3", [quantizerPath, inputMidi]);
            if (result.status !== 0) {
                throw new Error(`House quantizer failed: ${result.stderr.toString()}`);
            }
            // Move from default output to pipeline output
            const houseOut = path.join("pipeline/output/house_skeletons", `house_skeleton_${path.basename(inputMidi)}`);
            fs.copyFileSync(houseOut, finalMidiPath);
        } else {
            console.log(`Step 2: Generating procedural ${targetBpm} BPM Psytrance patterns...`);
            const effectiveConfig = { ...psyConfig, targetBpm };
            const psyMidi = PsyGenerator.generate(dna, effectiveConfig);
            PsyGenerator.saveMidi(psyMidi, finalMidiPath);

            console.log(`Step 2b: Rendering multi-track stems...`);
            await this.renderer.renderStems(psyMidi, path.join(outputDir, "stems"));
        }
        console.log(`MIDI saved to ${finalMidiPath}`);

        // 2c. Render preview audio
        const rawAudioPath = finalMidiPath.replace('.mid', '_raw.wav');
        const finalAudioPath = finalMidiPath.replace('.mid', '.wav');
        console.log(`Step 2c: Rendering structural preview audio...`);
        this.renderer.render(finalMidiPath, rawAudioPath);

        // 2d. Sonic Vacuum Enhancement
        console.log(`Step 2d: Applying Sonic Vacuum enhancement...`);
        const vacuumPath = path.join(__dirname, "../pipeline/processing/sonic_vacuum.py");
        const vacuumResult = spawnSync("python3", [vacuumPath, rawAudioPath, finalAudioPath]);
        if (vacuumResult.status !== 0) {
            console.warn(`Sonic Vacuum failed: ${vacuumResult.stderr.toString()}. Using raw audio.`);
            fs.copyFileSync(rawAudioPath, finalAudioPath);
        }

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
        let aiAudioPath = finalAudioPath;
        if (aiPrompt) {
            console.log(`Step 4: Orchestrating AI Sound Design Overhaul...`);
            const aiBridge = new AIBridge({});
            aiAudioPath = await aiBridge.remakeWithAI(finalAudioPath, aiPrompt);
            console.log(`AI Overhaul complete: ${aiAudioPath}`);
        }

        // 5. Automated Metadata Tagging & Publishing
        console.log(`Step 5: Tagging and Publishing...`);
        const trackManager = new TrackManager();
        await trackManager.publish(aiAudioPath, {
            title: dna.title,
            genre: genre === "psytrance" ? "Psytrance" : "House",
            bpm: targetBpm,
            key: dna.key,
            version: "0.9.0",
            artist: "Hymnmania AI",
            album: "Omni-Archive"
        });

        console.log(`--- [Psy-Mono Pipeline] Finished ---`);
    }
}

// CLI Entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: ts-node src/pipeline.ts <input_midi|--continuous> <output_dir> [--vocal <vocal_path>] [--bpm <bpm>] [--genre <psytrance|house>]");
        process.exit(1);
    }

    let inputMidi: string | undefined = args[0] === "--continuous" ? undefined : args[0];
    let continuous = args[0] === "--continuous";
    const outputDir = args[1];
    let vocalTrack: string | undefined;
    let targetBpm = 145;
    let genre: any = "psytrance";

    for (let i = 2; i < args.length; i++) {
        if (args[i] === "--vocal" && args[i+1]) {
            vocalTrack = args[i+1];
            i++;
        } else if (args[i] === "--bpm" && args[i+1]) {
            targetBpm = parseInt(args[i+1]);
            i++;
        } else if (args[i] === "--genre" && args[i+1]) {
            genre = args[i+1];
            i++;
        }
    }

    const pipeline = new PsyMonoPipeline();
    pipeline.run({
        inputMidi,
        outputDir,
        vocalTrack,
        targetBpm,
        genre,
        continuous,
        aiPrompt: genre === "house" ?
            "Deep House, 124 BPM, soulful, smooth textures, professional club master" :
            "Modern Full-On Psytrance, 145 BPM, driving, psychedelic sound design, festival grade master"
    }).catch(console.error);
}
