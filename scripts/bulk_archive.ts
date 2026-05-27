import { TrackManager } from "../src/integrators/track_manager";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

async function bulkArchive() {
    console.log("--- Starting Bulk Archiving ---");
    const outputBase = "pipeline/output";
    if (!fs.existsSync(outputBase)) {
        console.log("No output directory found.");
        return;
    }

    const publishedDir = "public/published";
    const manifestPath = path.join(publishedDir, "manifest.json");
    let manifest: any[] = [];
    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }

    const archivedTitles = new Set(manifest.map((t: any) => t.title));

    const productions = fs.readdirSync(outputBase).filter(f => {
        const fullPath = path.join(outputBase, f);
        return fs.statSync(fullPath).isDirectory() && f !== "house_skeletons";
    });

    for (const prod of productions) {
        const prodPath = path.join(outputBase, prod);

        if (archivedTitles.has(prod)) {
            console.log(`Skipping ${prod} - already in manifest.`);
            continue;
        }

        console.log(`Processing ${prod}...`);
        const result = spawnSync("npx", ["ts-node", "scripts/archive_production.ts", prodPath], { stdio: "inherit" });
        if (result.status === 0) {
            console.log(`Successfully archived ${prod}.`);
        } else {
            console.error(`Failed to archive ${prod}.`);
        }
    }

    console.log("--- Bulk Archiving Complete ---");
}

if (require.main === module) {
    bulkArchive().catch(console.error);
}
