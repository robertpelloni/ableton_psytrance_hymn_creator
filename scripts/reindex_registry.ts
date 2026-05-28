import * as fs from "fs";
import * as path from "path";

async function reindexRegistry() {
    console.log("--- Starting Registry Re-indexing ---");
    const registryDir = "public/registry";
    const publishedDir = "public/published";
    const manifestPath = path.join(publishedDir, "manifest.json");

    if (!fs.existsSync(registryDir)) {
        console.error("Registry directory not found.");
        return;
    }

    const sidecars = fs.readdirSync(registryDir).filter(f => f.endsWith(".json") && f.startsWith("Archive-"));
    const tracks: any[] = [];

    for (const sidecar of sidecars) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(registryDir, sidecar), "utf-8"));
            // Ensure essential fields exist
            const fileName = data.fileName || data.originalFileName;
            if (data.title && fileName) {
                tracks.push({ ...data, fileName });
                console.log(`Indexed: ${data.title} (${fileName})`);
            }
        } catch (e) {
            console.error(`Failed to parse sidecar ${sidecar}:`, e);
        }
    }

    // Sort by publication date or filename
    tracks.sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0).getTime();
        const dateB = new Date(b.publishedAt || 0).getTime();
        return dateB - dateA;
    });

    fs.writeFileSync(manifestPath, JSON.stringify(tracks, null, 2));
    console.log(`Re-indexing complete. ${tracks.length} tracks indexed in ${manifestPath}`);
}

if (require.main === module) {
    reindexRegistry().catch(console.error);
}
