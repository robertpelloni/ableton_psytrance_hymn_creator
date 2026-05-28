import { PsyMonoPipeline } from "../src/pipeline";
import * as path from "path";
import * as fs from "fs";

async function runCanary() {
    const pipeline = new PsyMonoPipeline();
    const outputDir = path.join(process.cwd(), "pipeline/output/canary");

    console.log("Starting Canary Run (Minimal Production Verification)...");

    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }

    try {
        await pipeline.run({
            inputMidi: "hymnmania_src/hymn_remaker/test_input/Emmanuel.mid",
            outputDir: outputDir,
            genre: "psytrance",
            mood: "energetic",
            useAi: false, // Skip neural texture design for fast verification
            psyConfig: {
                targetBpm: 145,
                euclideanDensity: 5,
                octaveJumpBarFrequency: 2,
                bassVelocity: 0.7,
                leadVelocity: 0.8,
                kickVelocity: 0.9,
                gallopVariant: "classic",
                durationLimit: 15 // Only 15 seconds for verification
            }
        });

        console.log("Canary Run successful. Artifacts generated in:", outputDir);

        // Copy verification artifact to registry for tracking
        const registryDir = path.join(process.cwd(), "public/registry");
        if (!fs.existsSync(registryDir)) fs.mkdirSync(registryDir, { recursive: true });

        const midiPath = path.join(outputDir, "structure.mid");
        const verificationMidi = path.join(registryDir, "canary_verification.mid");
        if (fs.existsSync(midiPath)) {
            fs.copyFileSync(midiPath, verificationMidi);
            console.log("Verification MIDI copied to registry.");
        }

    } catch (error) {
        console.error("Canary Run failed:", error);
        process.exit(1);
    }
}

runCanary();
