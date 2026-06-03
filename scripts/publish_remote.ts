import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script to update global repository metadata and prepare assets for remote delivery.
 */
async function deploy() {
    console.log("--- Starting Deployment & Remote Publishing ---");

    const manifestPath = "public/published/manifest.json";
    if (!fs.existsSync(manifestPath)) {
        console.error("No manifest found. Nothing to deploy.");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const trackCount = manifest.length;
    const totalDuration = manifest.reduce((acc: number, track: any) => acc + (track.technical?.duration || 0), 0);

    const stats = {
        lastUpdate: new Date().toISOString(),
        totalTracks: trackCount,
        totalDurationSeconds: totalDuration,
        averageBpm: manifest.reduce((acc: number, t: any) => acc + t.bpm, 0) / trackCount,
        registryStats: {
            midiCount: manifest.filter((t: any) => t.artifacts?.midi).length,
            videoCount: manifest.filter((t: any) => t.artifacts?.video).length,
            syncedCount: manifest.filter((t: any) => t.remoteUrl).length
        }
    };

    console.log(`Stats: ${trackCount} tracks, ${Math.round(totalDuration / 60)} minutes total.`);

    fs.writeFileSync("public/published/stats.json", JSON.stringify(stats, null, 2));
    console.log("Updated public/published/stats.json");

    // Simulation of remote asset delivery (e.g., S3 upload)
    console.log("[Remote Simulation] Syncing assets to CDN...");
    manifest.forEach((track: any) => {
        console.log(`[CDN Sync] ${track.fileName} ... OK`);
    });

    console.log("--- Deployment Complete ---");
}

if (require.main === module) {
    deploy().catch(console.error);
}
