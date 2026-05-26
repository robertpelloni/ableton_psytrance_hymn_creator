import { VocalProcessor } from "./integrators/vocal_processor";
import * as fs from "fs";
import * as path from "path";

async function test() {
    const processor = new VocalProcessor({
        mode: 'local',
        targetBpm: 145,
        targetKey: 'Dmin'
    });

    const outputDir = "pipeline/output/vocal_test";
    const dummyInput = path.join(outputDir, "dummy_input.wav");

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a 5 second dummy beep for testing
    const { spawnSync } = require('child_process');
    spawnSync('ffmpeg', [
        '-y',
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=5',
        dummyInput
    ]);

    console.log("Processing dummy vocal...");
    const result = await processor.process(dummyInput, outputDir);
    console.log(`Final processed vocal: ${result}`);
}

test().catch(console.error);
