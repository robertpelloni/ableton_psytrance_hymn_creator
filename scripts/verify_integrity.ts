import * as fs from "fs";
import * as path from "path";

/**
 * Validates the integrity of the track repository by checking consistency
 * between manifest.json, registry files, and their sidecars.
 */
async function verifyIntegrity() {
    console.log("--- Starting Integrity Verification ---");
    const manifestPath = "public/published/manifest.json";
    const registryDir = "public/registry";

    if (!fs.existsSync(manifestPath)) {
        console.log("No manifest found. Skipping.");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    let errors = 0;

    for (const track of manifest) {
        const title = track.title || "Untitled";
        const sidecarBase = track.fileName.replace(/^Published-/, "Archive-").replace(/\.wav$/, "");
        const sidecarPath = path.join(registryDir, sidecarBase + ".json");
        const wavPath = path.join(registryDir, sidecarBase + ".wav");

        if (!fs.existsSync(sidecarPath)) {
            console.error(`[Error] Missing sidecar for ${title}: ${sidecarPath}`);
            errors++;
        }

        if (!fs.existsSync(wavPath)) {
            // Some might not have wav if they are purely MIDI or archived differently
            console.warn(`[Warn] Missing registry WAV for ${title}: ${wavPath}`);
        }

        if (track.artifacts) {
            for (const [key, artifactFile] of Object.entries(track.artifacts)) {
                if (typeof artifactFile === 'string' && key !== "stems") { // skip stems as it's a simulated zip
                    const artifactPath = path.join(registryDir, artifactFile);
                    if (!fs.existsSync(artifactPath)) {
                        console.warn(`[Warn] Missing artifact for ${title}: ${key} -> ${artifactPath}`);
                    }
                }
            }
        }
    }

    if (errors > 0) {
        console.error(`--- Integrity Check FAILED with ${errors} errors ---`);
        process.exit(1);
    } else {
        console.log("--- Integrity Check PASSED ---");
    }
}

if (require.main === module) {
    verifyIntegrity().catch(console.error);
}
