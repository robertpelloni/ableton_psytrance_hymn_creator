import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

export interface TrackArtifacts {
    midi?: string;
    stemsDir?: string;
    video?: string;
    videoVertical?: string;
    cover?: string;
}

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
    publishedAt?: string;
    updatedAt?: string;
    inputMidi?: string;
    mood?: string;
    styleModelVersion?: string;
    artifacts?: {
        midi?: string;
        stems?: string;
        video?: string;
        videoVertical?: string;
        cover?: string;
    };
    searchTokens?: string;
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
    async publish(sourcePath: string, metadata: TrackMetadata, artifacts?: TrackArtifacts): Promise<string> {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        const safeTitle = metadata.title.replace(/\s+/g, "_");

        // 1. Tag the audio file
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

        // 2. Versioned Move for published audio
        const fileName = `Published-${safeTitle}-${metadata.version}-${timestamp}${path.extname(sourcePath)}`;
        const destinationPath = path.join(this.publishedDir, fileName);

        fs.copyFileSync(sourcePath, destinationPath);
        console.log(`Published track to: ${destinationPath}`);

        // 3. Extract final verified metadata for manifest
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

        // 4. Archive Artifacts with date-based folder structure
        const now = new Date();
        const datePath = path.join(
            now.getUTCFullYear().toString(),
            (now.getUTCMonth() + 1).toString().padStart(2, '0'),
            now.getUTCDate().toString().padStart(2, '0')
        );
        const finalRegistryDir = path.join(this.registryDir, datePath);
        if (!fs.existsSync(finalRegistryDir)) fs.mkdirSync(finalRegistryDir, { recursive: true });

        const archiveBase = `Archive-${safeTitle}-${metadata.version}-${timestamp}`;
        metadata.artifacts = {};

        if (artifacts) {
            if (artifacts.midi && fs.existsSync(artifacts.midi)) {
                const midiName = `${archiveBase}.mid`;
                fs.copyFileSync(artifacts.midi, path.join(finalRegistryDir, midiName));
                metadata.artifacts.midi = path.join(datePath, midiName);
            }
            if (artifacts.video && fs.existsSync(artifacts.video)) {
                const videoName = `${archiveBase}.mp4`;
                fs.copyFileSync(artifacts.video, path.join(finalRegistryDir, videoName));
                metadata.artifacts.video = path.join(datePath, videoName);
            }
            if (artifacts.videoVertical && fs.existsSync(artifacts.videoVertical)) {
                const videoVerticalName = `${archiveBase}_vertical.mp4`;
                fs.copyFileSync(artifacts.videoVertical, path.join(finalRegistryDir, videoVerticalName));
                metadata.artifacts.videoVertical = path.join(datePath, videoVerticalName);
            }
            if (artifacts.cover && fs.existsSync(artifacts.cover)) {
                const coverName = `${archiveBase}-cover${path.extname(artifacts.cover)}`;
                fs.copyFileSync(artifacts.cover, path.join(finalRegistryDir, coverName));
                metadata.artifacts.cover = path.join(datePath, coverName);
            }
            if (artifacts.stemsDir && fs.existsSync(artifacts.stemsDir)) {
                const stemsZipName = `${archiveBase}-stems.zip`;
                const stemsZipPath = path.join(finalRegistryDir, stemsZipName);

                console.log(`Packaging stems ZIP...`);
                // Use native zip command for reliability in this env
                const zipResult = spawnSync("zip", ["-r", "-j", stemsZipPath, artifacts.stemsDir]);
                if (zipResult.status === 0) {
                    metadata.artifacts.stems = path.join(datePath, stemsZipName);
                } else {
                    console.error(`Zip failed: ${zipResult.stderr.toString()}`);
                }
            }
        }

        // 5. Archive Main Track to Registry with sidecar
        const archivePath = path.join(finalRegistryDir, archiveBase + path.extname(sourcePath));
        const sidecarPath = path.join(finalRegistryDir, archiveBase + ".json");

        fs.copyFileSync(destinationPath, archivePath);

        // Compute search tokens for sidecar and manifest
        const tokens = [
            metadata.title,
            metadata.genre,
            metadata.mood,
            metadata.key,
            metadata.version,
            metadata.artist,
            metadata.inputMidi
        ].filter(Boolean).map(s => s!.toLowerCase());
        metadata.searchTokens = tokens.join(" ");

        const sidecarMetadata = {
            ...metadata,
            originalFileName: fileName,
            publishedAt: metadata.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(sidecarPath, JSON.stringify(sidecarMetadata, null, 2));
        console.log(`Archived to registry: ${archivePath}`);

        // 6. Update manifest
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

        const existingIndex = manifest.findIndex(t => t.fileName === fileName);
        const entry = {
            ...(existingIndex >= 0 ? manifest[existingIndex] : {}),
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
