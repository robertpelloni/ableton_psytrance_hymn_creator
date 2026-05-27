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
    technical?: any;
    streamingUrls?: { [key: string]: string };
    remoteUrl?: string;
    inputMidi?: string;
    styleModelVersion?: string;
}

export class TrackManager {
    private publishedDir: string;
    private registryDir: string;

    constructor(publishedDir: string = "public/published", registryDir: string = "public/registry") {
        this.publishedDir = publishedDir;
        this.registryDir = registryDir;
        [this.publishedDir, this.registryDir].forEach(d => {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        });
    }

    /**
     * Tags and publishes a track to the published directory.
     */
    async publish(sourcePath: string, metadata: TrackMetadata): Promise<string> {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }

        // 1. Tag the file
        let taggerPath = path.join(__dirname, "metadata_tagger.py");
        if (!fs.existsSync(taggerPath)) {
            taggerPath = path.join(process.cwd(), "src/integrators/metadata_tagger.py");
        }
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

        // 3. Extract final verified metadata
        let extractorPath = path.join(__dirname, "metadata_extractor.py");
        if (!fs.existsSync(extractorPath)) {
            extractorPath = path.join(process.cwd(), "src/integrators/metadata_extractor.py");
        }
        const extResult = spawnSync("python3", [extractorPath, destinationPath]);
        if (extResult.status === 0) {
            const extData = JSON.parse(extResult.stdout.toString());
            if (extData.success) {
                metadata.technical = extData.technical;
            }
        }

        // 4. Archive to Registry with sidecar
        const archiveName = `Archive-${metadata.title.replace(/\s+/g, "_")}-${metadata.version}-${timestamp}`;
        const archivePath = path.join(this.registryDir, archiveName + path.extname(sourcePath));
        const sidecarPath = path.join(this.registryDir, archiveName + ".json");

        fs.copyFileSync(destinationPath, archivePath);
        fs.writeFileSync(sidecarPath, JSON.stringify({ ...metadata, originalFileName: fileName }, null, 2));
        console.log(`Archived to registry: ${archivePath}`);

        // 5. Update manifest
        this.updateManifest(metadata, fileName);

        return destinationPath;
    }

    /**
     * Updates an existing entry in the manifest with new metadata (like remoteUrl).
     */
    async updateMetadata(fileName: string, metadataUpdates: Partial<TrackMetadata>): Promise<void> {
        const manifestPath = path.join(this.publishedDir, "manifest.json");
        if (!fs.existsSync(manifestPath)) return;

        let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const index = manifest.findIndex((t: any) => t.fileName === fileName);

        if (index >= 0) {
            manifest[index] = { ...manifest[index], ...metadataUpdates, updatedAt: new Date().toISOString() };
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(`Updated manifest for ${fileName}`);
        }
    }

    private updateManifest(metadata: TrackMetadata, fileName: string) {
        const manifestPath = path.join(this.publishedDir, "manifest.json");
        let manifest: any[] = [];

        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        }

        // Check if track already exists (update instead of push)
        const existingIndex = manifest.findIndex(t => t.fileName === fileName);
        const entry = {
            ...metadata,
            fileName,
            publishedAt: existingIndex >= 0 ? manifest[existingIndex].publishedAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            manifest[existingIndex] = entry;
        } else {
            manifest.push(entry);
        }

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
}
