import * as fs from "fs";
import * as path from "path";
import { StreamingPublisher } from "../src/integrators/streaming_publisher";
import { TrackManager } from "../src/integrators/track_manager";

/**
 * Automated Streaming Publishing Workflow
 * Identifies tracks in the manifest that lack external streaming URLs
 * and attempts to publish them to YouTube and Soundcloud.
 */
async function runPublishingWorkflow() {
    console.log("--- Starting Automated Streaming Publishing Workflow ---");

    const manifestPath = "public/published/manifest.json";
    if (!fs.existsSync(manifestPath)) {
        console.log("No manifest found. Nothing to publish.");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const trackManager = new TrackManager();
    const publishedDir = "public/published";
    const registryDir = "public/registry";

    for (const track of manifest) {
        let updated = false;
        const streamingUrls = track.streamingUrls || {};

        // 1. YouTube (Video)
        if (!streamingUrls["YouTube"]) {
            const videoFileName = track.artifacts?.video;
            if (videoFileName) {
                const videoPath = path.join(registryDir, videoFileName);
                if (fs.existsSync(videoPath)) {
                    console.log(`[Workflow] Catch-up publishing to YouTube: ${track.title}`);
                    const result = await StreamingPublisher.publishToYouTube(videoPath, track);
                    if (result.success && result.externalUrl) {
                        streamingUrls["YouTube"] = result.externalUrl;
                        updated = true;
                    }
                }
            }
        }

        // 2. Soundcloud (Audio)
        if (!streamingUrls["Soundcloud"]) {
            const audioPath = path.join(publishedDir, track.fileName);
            if (fs.existsSync(audioPath)) {
                console.log(`[Workflow] Catch-up publishing to Soundcloud: ${track.title}`);
                const result = await StreamingPublisher.publishToSoundcloud(audioPath, track);
                if (result.success && result.externalUrl) {
                    streamingUrls["Soundcloud"] = result.externalUrl;
                    updated = true;
                }
            }
        }

        if (updated) {
            await trackManager.updateMetadata(track.fileName, { streamingUrls });
            console.log(`[Workflow] Updated streaming URLs for ${track.title}`);
        }
    }

    console.log("--- Automated Streaming Publishing Workflow Complete ---");
}

if (require.main === module) {
    runPublishingWorkflow().catch(console.error);
}
