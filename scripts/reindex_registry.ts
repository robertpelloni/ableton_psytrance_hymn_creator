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

    const tracks: any[] = [];

    function walk(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else if (file.endsWith(".json") && file.startsWith("Archive-")) {
                try {
                    const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
                    const fileName = data.fileName || data.originalFileName;
                    if (data.title && fileName) {
                        // Restore critical metadata fields from sidecar
                        const track = {
                            ...data,
                            fileName,
                            publishedAt: data.publishedAt || new Date(fs.statSync(fullPath).birthtime).toISOString(),
                            updatedAt: data.updatedAt || new Date(fs.statSync(fullPath).mtime).toISOString()
                        };
                        tracks.push(track);
                        console.log(`Indexed: ${data.title} (${fileName})`);
                    }
                } catch (e) {
                    console.error(`Failed to parse sidecar ${file}:`, e);
                }
            }
        }
    }

    walk(registryDir);

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
