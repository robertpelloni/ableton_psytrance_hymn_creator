import { MidiParser } from "./analysis/midi_parser";
import { PsyGenerator, PsyConfig, DEFAULT_PSY_CONFIG } from "./sequencer/psy_generator";
import { MoodMapper, Mood } from "./sequencer/mood_mapper";
import { VocalProcessor } from "./integrators/vocal_processor";
import { AIBridge } from "./integrators/ai_bridge";
import { TrackManager } from "./integrators/track_manager";
import { RenderingModule } from "./rendering/renderer";
import { VideoGenerator } from "./rendering/video_generator";
import { StreamingPublisher } from "./integrators/streaming_publisher";
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
    useAi?: boolean;
    mood?: Mood;
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

    async run(options: PipelineOptions): Promise<void> {
        let { inputMidi, outputDir, psyConfig = DEFAULT_PSY_CONFIG, vocalTrack, targetBpm = 145, aiPrompt, genre = "psytrance", continuous = false } = options;

        // Load style model if available
        const modelPath = "public/models/hymn_style_v1.json";
        if (fs.existsSync(modelPath)) {
            try {
                const model = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
                psyConfig.styleModel = model;
                console.log("Loaded style model for generation.");
            } catch (e) {
                console.warn("Failed to load style model:", e);
            }
        }

        if (continuous || !inputMidi) {
            console.log("Continuous mode active. Selecting random MIDI...");
            inputMidi = this.getRandomMidi();
        }

        // Apply Mood modifications if provided
        if (options.mood) {
            console.log(`Applying mood profile: ${options.mood}`);
            psyConfig = MoodMapper.applyMood(psyConfig, options.mood);
            targetBpm = psyConfig.targetBpm;

            const addon = MoodMapper.getPromptAddon(options.mood);
            if (aiPrompt) {
                aiPrompt += `, ${addon}`;
            } else {
                aiPrompt = addon;
            }
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
            let quantizerPath = path.join(__dirname, "../pipeline/processing/house_quantizer.py");
            if (!fs.existsSync(quantizerPath)) {
                quantizerPath = path.join(process.cwd(), "pipeline/processing/house_quantizer.py");
            }

            // Check for swing recommendation from feedback
            let swing = 0.0;
            const insightsPath = "public/published/insights.json";
            if (fs.existsSync(insightsPath)) {
                const insights = JSON.parse(fs.readFileSync(insightsPath, "utf-8"));
                if (insights.recommendations?.includes("apply_swing")) {
                    console.log("Applying feedback-derived swing (0.1)...");
                    swing = 0.1;
                }
            }

            const result = spawnSync("python3", [quantizerPath, inputMidi, swing.toString()]);
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
        let vacuumPath = path.join(__dirname, "../pipeline/processing/sonic_vacuum.py");
        if (!fs.existsSync(vacuumPath)) {
            vacuumPath = path.join(process.cwd(), "pipeline/processing/sonic_vacuum.py");
        }
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
            aiAudioPath = await aiBridge.remakeWithAI(finalAudioPath, aiPrompt, options.useAi);
            console.log(`AI Overhaul complete: ${aiAudioPath}`);
        }

        // 4b. Quality Gate
        console.log(`Step 4b: Running Quality Gate...`);
        let qualityCheckerPath = path.join(__dirname, "analysis/quality_checker.py");
        if (!fs.existsSync(qualityCheckerPath)) {
            qualityCheckerPath = path.join(process.cwd(), "src/analysis/quality_checker.py");
        }
        const qualityResult = spawnSync("python3", [qualityCheckerPath, aiAudioPath]);
        if (qualityResult.status === 0) {
            const report = JSON.parse(qualityResult.stdout.toString());
            console.log(`Quality Report:`, JSON.stringify(report, null, 2));
            if (!report.success) {
                console.error(`Quality Gate Failed:`, report.errors);
                if (continuous) {
                    console.warn(`Continuous mode: Retrying with different seed...`);
                    return this.run(options); // Recursive retry
                }
                throw new Error(`Quality Gate Failed: ${report.errors.join(", ")}`);
            }
        }

        // 5. Automated Metadata Tagging & Publishing
        console.log(`Step 5: Tagging and Publishing...`);
        const trackManager = new TrackManager();
        const metadata = {
            title: dna.title,
            genre: genre === "psytrance" ? "Psytrance" : "House",
            bpm: targetBpm,
            key: dna.key,
            version: fs.readFileSync("VERSION.md", "utf-8").trim(),
            mood: options.mood,
            artist: "Hymnmania AI",
            album: "Omni-Archive",
            streamingUrls: {} as { [key: string]: string },
            inputMidi: path.basename(inputMidi),
            styleModelVersion: psyConfig.styleModel?.version || fs.readFileSync("VERSION.md", "utf-8").trim()
        };

        // 6. Video Generation
        console.log(`Step 6: Video Generation...`);
        let videoPath: string | undefined;
        let coverPath: string | undefined = path.join("public/assets", "default_cover.png");
        try {
            videoPath = path.join(outputDir, "video.mp4");
            VideoGenerator.generate(aiAudioPath, coverPath, videoPath);
        } catch (e) {
            console.error("Video generation failed:", e);
            videoPath = undefined;
        }

        // 7. Publishing & Archiving
        console.log(`Step 7: Publishing & Archiving artifacts...`);
        const artifacts = {
            midi: finalMidiPath,
            video: videoPath,
            cover: coverPath,
            stemsDir: path.join(outputDir, "stems")
        };
        const publishedAudioPath = await trackManager.publish(aiAudioPath, metadata, artifacts);

        // 8. Streaming Upload
        console.log(`Step 8: Streaming Upload...`);
        try {
            if (videoPath) {
                const ytResult = await StreamingPublisher.publishToYouTube(videoPath, metadata);
                if (ytResult.success && ytResult.externalUrl) {
                    metadata.streamingUrls["YouTube"] = ytResult.externalUrl;
                    // Update manifest with new metadata (including streaming URLs)
                    await trackManager.updateMetadata(path.basename(publishedAudioPath), { streamingUrls: metadata.streamingUrls });
                }
            }
        } catch (e) {
            console.error("Streaming upload failed:", e);
        }

        console.log(`--- [Psy-Mono Pipeline] Finished ---`);
    }
}

// CLI Entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: ts-node src/pipeline.ts <input_midi|--continuous> <output_dir> [options]");
        console.log("Options: --vocal <path>, --bpm <bpm>, --genre <genre>, --density <1-8>, --octaves <0-4>, --variant <classic|triplet|rolling>, --use-ai, --mood <mood>");
        process.exit(1);
    }

    let inputMidi: string | undefined = args[0] === "--continuous" ? undefined : args[0];
    let continuous = args[0] === "--continuous";
    const outputDir = args[1];
    let vocalTrack: string | undefined;
    let targetBpm = 145;
    let genre: any = "psytrance";
    let density = 5;
    let octaves = 2;
    let variant: any = "classic";
    let useAi = false;
    let mood: any = undefined;

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
        } else if (args[i] === "--density" && args[i+1]) {
            density = parseInt(args[i+1]);
            i++;
        } else if (args[i] === "--octaves" && args[i+1]) {
            octaves = parseInt(args[i+1]);
            i++;
        } else if (args[i] === "--variant" && args[i+1]) {
            variant = args[i+1];
            i++;
        } else if (args[i] === "--use-ai") {
            useAi = true;
        } else if (args[i] === "--mood" && args[i+1]) {
            mood = args[i+1];
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
        useAi,
        mood,
        psyConfig: {
            targetBpm,
            euclideanDensity: density,
            octaveJumpBarFrequency: octaves,
            gallopVariant: variant,
            bassVelocity: 0.7,
            leadVelocity: 0.8,
            kickVelocity: 0.9
        },
        aiPrompt: genre === "house" ?
            "Deep House, 124 BPM, soulful, smooth textures, professional club master" :
            "Modern Full-On Psytrance, 145 BPM, driving, psychedelic sound design, festival grade master"
    }).catch(console.error);
}
