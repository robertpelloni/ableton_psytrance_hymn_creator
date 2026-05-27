import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

export interface TrackMetadata {
    title: string;
    artist?: string;
    album?: string;
    year?: string;
    genre: string;
    bpm: number;
    key: string;
    version: string;
}

export class TrackManager {
    private publishedDir: string;

    constructor(publishedDir: string = "published") {
        this.publishedDir = publishedDir;
        if (!fs.existsSync(this.publishedDir)) {
            fs.mkdirSync(this.publishedDir, { recursive: true });
        }
    }

    /**
     * Tags and publishes a track to the published directory.
     */
    async publish(sourcePath: string, metadata: TrackMetadata): Promise<string> {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }

        // 1. Tag the file
        const taggerPath = path.join(__dirname, "metadata_tagger.py");
        const result = spawnSync("python3", [taggerPath, sourcePath, JSON.stringify(metadata)]);

        if (result.status !== 0) {
            console.error(`Tagger failed: ${result.stderr.toString()}`);
        } else {
            console.log(`Tagged: ${sourcePath}`);
        }

        // 2. Versioned Move
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        const fileName = `Published-${metadata.title.replace(/\s+/g, "_")}-${metadata.version}-${timestamp}${path.extname(sourcePath)}`;
        const destinationPath = path.join(this.publishedDir, fileName);

        fs.copyFileSync(sourcePath, destinationPath);
        console.log(`Published track to: ${destinationPath}`);

        // 3. Update manifest
        this.updateManifest(metadata, fileName);

        return destinationPath;
    }

    private updateManifest(metadata: TrackMetadata, fileName: string) {
        const manifestPath = path.join(this.publishedDir, "manifest.json");
        let manifest: any[] = [];

        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        }

        manifest.push({
            ...metadata,
            fileName,
            publishedAt: new Date().toISOString()
        });

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
}
