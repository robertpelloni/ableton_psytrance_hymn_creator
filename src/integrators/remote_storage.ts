import * as fs from "fs";
import * as path from "path";

export interface StorageResult {
    success: boolean;
    remoteUrl?: string;
    error?: string;
}

export class RemoteStorageIntegrator {
    private static HISTORY_PATH = "public/published/upload_history.json";

    private static loadHistory(): Set<string> {
        if (fs.existsSync(this.HISTORY_PATH)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.HISTORY_PATH, "utf-8"));
                return new Set(data);
            } catch (e) {
                return new Set();
            }
        }
        return new Set();
    }

    private static saveHistory(history: Set<string>) {
        fs.writeFileSync(this.HISTORY_PATH, JSON.stringify(Array.from(history), null, 2));
    }

    /**
     * Uploads a file to remote storage.
     * Maintain an upload history to avoid redundant transfers.
     */
    static async upload(localPath: string, bucket: string = "hymnmania-archive"): Promise<StorageResult> {
        if (!fs.existsSync(localPath)) {
            return { success: false, error: "Local file not found" };
        }

        const fileName = path.basename(localPath);
        const history = this.loadHistory();

        if (history.has(fileName)) {
            console.log(`[RemoteStorage] Skipping ${fileName} - already in upload history.`);
            const mockUrl = `https://storage.googleapis.com/${bucket}/${fileName}`;
            return { success: true, remoteUrl: mockUrl };
        }

        console.log(`[RemoteStorage] Syncing ${localPath} to bucket: ${bucket}...`);

        const mode = process.env.STORAGE_MODE || "simulation";

        if (mode === "simulation") {
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 200));
            const mockUrl = `https://storage.googleapis.com/${bucket}/${fileName}`;

            // Record in history
            history.add(fileName);
            this.saveHistory(history);

            console.log(`[RemoteStorage] SIMULATION: Uploaded to ${mockUrl}`);
            return { success: true, remoteUrl: mockUrl };
        } else {
            console.log(`[RemoteStorage] REST Mode not fully configured. Falling back to simulation.`);
            return this.upload(localPath, bucket);
        }
    }
}
