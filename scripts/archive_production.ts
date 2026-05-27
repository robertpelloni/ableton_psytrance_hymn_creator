import { TrackManager } from "../src/integrators/track_manager";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

async function archiveProduction(productionDir: string) {
    console.log(`--- Archiving Production Directory: ${productionDir} ---`);

    if (!fs.existsSync(productionDir)) {
        console.error(`Directory not found: ${productionDir}`);
        return;
    }

    const trackManager = new TrackManager();

    // Identify main audio file (prefer AI remake, then final .wav)
    let audioPath = path.join(productionDir, "structure_ai_remake.wav");
    if (!fs.existsSync(audioPath)) {
        audioPath = path.join(productionDir, "structure.wav");
    }

    if (!fs.existsSync(audioPath)) {
        console.error(`Main audio file not found in ${productionDir}`);
        return;
    }

    // Identify artifacts
    const midiPath = path.join(productionDir, "structure.mid");
    const videoPath = path.join(productionDir, "video.mp4");
    const stemsDir = path.join(productionDir, "stems");
    const coverPath = path.join(productionDir, "fallback_cover.png"); // Assuming fallback exists if custom doesn't

    // Try to find some metadata from structure.mid or directory name
    const title = path.basename(productionDir);
    const metadata = {
        title: title,
        genre: "Unknown",
        bpm: 0,
        key: "Unknown",
        version: "1.0.0",
        artist: "Hymnmania AI Archive"
    };

    const artifacts = {
        midi: fs.existsSync(midiPath) ? midiPath : undefined,
        video: fs.existsSync(videoPath) ? videoPath : undefined,
        stemsDir: fs.existsSync(stemsDir) ? stemsDir : undefined,
        cover: fs.existsSync(coverPath) ? coverPath : undefined
    };

    console.log(`Archiving track: ${title}`);
    const publishedPath = await trackManager.publish(audioPath, metadata, artifacts);
    console.log(`Successfully archived to: ${publishedPath}`);
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: ts-node scripts/archive_production.ts <production_dir>");
        process.exit(1);
    }
    archiveProduction(args[0]).catch(console.error);
}
