import * as fs from "fs";
import * as path from "path";
import { RemoteStorageIntegrator } from "../src/integrators/remote_storage";
import { TrackManager } from "../src/integrators/track_manager";

async function sync() {
    console.log("--- Starting Remote Synchronization ---");
    const publishedDir = "public/published";
    const manifestPath = path.join(publishedDir, "manifest.json");

    if (!fs.existsSync(manifestPath)) {
        console.log("No manifest found. Nothing to sync.");
        return;
    }

    const trackManager = new TrackManager();
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    for (const track of manifest) {
        if (!track.remoteUrl) {
            console.log(`Syncing missing remote asset: ${track.fileName}`);
            const localPath = path.join(publishedDir, track.fileName);

            const result = await RemoteStorageIntegrator.upload(localPath);
            if (result.success && result.remoteUrl) {
                await trackManager.updateMetadata(track.fileName, { remoteUrl: result.remoteUrl });
            } else {
                console.error(`Failed to sync ${track.fileName}: ${result.error}`);
            }
        } else {
            console.log(`Asset already has remote URL: ${track.fileName}`);
        }
    }

    console.log("--- Remote Sync Complete ---");
}

if (require.main === module) {
    sync().catch(console.error);
}
