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

    // Create a set of all files in registry recursively
    const registryFiles = new Set<string>();
    function walk(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else {
                registryFiles.add(path.relative(registryDir, fullPath));
            }
        }
    }
    walk(registryDir);

    for (const track of manifest) {
        const title = track.title || "Untitled";
        const sidecarBase = track.fileName.replace(/^Published-/, "Archive-").replace(/\.wav$/, "");

        // Find sidecar in the set
        const sidecarFile = Array.from(registryFiles).find(f => f.endsWith(sidecarBase + ".json"));
        const wavFile = Array.from(registryFiles).find(f => f.endsWith(sidecarBase + ".wav"));

        if (!sidecarFile) {
            console.error(`[Error] Missing sidecar for ${title}: ${sidecarBase}.json`);
            errors++;
        }

        if (!wavFile) {
            console.warn(`[Warn] Missing registry WAV for ${title}: ${sidecarBase}.wav`);
        }

        if (track.artifacts) {
            for (const [key, artifactFile] of Object.entries(track.artifacts)) {
                if (typeof artifactFile === 'string' && key !== "stems") {
                    if (!registryFiles.has(artifactFile)) {
                        console.warn(`[Warn] Missing artifact for ${title}: ${key} -> ${artifactFile}`);
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
