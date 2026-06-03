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
    const registryDir = "public/registry";

    for (const track of manifest) {
        // 1. Sync Main Audio
        if (!track.remoteUrl) {
            console.log(`Syncing missing remote audio: ${track.fileName}`);
            const localPath = path.join(publishedDir, track.fileName);

            const result = await RemoteStorageIntegrator.upload(localPath);
            if (result.success && result.remoteUrl) {
                await trackManager.updateMetadata(track.fileName, { remoteUrl: result.remoteUrl });
            } else {
                console.error(`Failed to sync ${track.fileName}: ${result.error}`);
            }
        }

        // 2. Sync Artifacts
        if (track.artifacts) {
            const artifactUpdates: any = {};
            for (const [key, fileName] of Object.entries(track.artifacts)) {
                if (typeof fileName !== 'string' || key === "stems") continue;

                const artifactKey = `${key}RemoteUrl`;
                if (!(track.artifacts as any)[artifactKey]) {
                    console.log(`Syncing artifact: ${fileName}`);
                    const localPath = path.join(registryDir, fileName);

                    const result = await RemoteStorageIntegrator.upload(localPath);
                    if (result.success && result.remoteUrl) {
                        artifactUpdates[artifactKey] = result.remoteUrl;
                    }
                }
            }

            if (Object.keys(artifactUpdates).length > 0) {
                await trackManager.updateMetadata(track.fileName, {
                    artifacts: { ...track.artifacts, ...artifactUpdates }
                });
            }
        }
    }

    console.log("--- Remote Sync Complete ---");
}

if (require.main === module) {
    sync().catch(console.error);
}
