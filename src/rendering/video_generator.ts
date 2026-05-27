import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export class VideoGenerator {
    /**
     * Generates a high-quality static-image music video from audio.
     */
    static generate(audioPath: string, imagePath: string, outputPath: string): string {
        console.log(`Generating music video for: ${audioPath}`);

        if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`);
        if (!fs.existsSync(imagePath)) {
            console.warn(`Cover image not found at ${imagePath}. Using fallback black image.`);
            imagePath = this.createFallbackImage(path.dirname(outputPath));
        }

        const result = spawnSync("ffmpeg", [
            "-y",
            "-loop", "1",
            "-i", imagePath,
            "-i", audioPath,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            outputPath
        ]);

        if (result.status !== 0) {
            console.error(`FFmpeg video generation failed: ${result.stderr.toString()}`);
            throw new Error("Video generation failed");
        }

        console.log(`Video generated at: ${outputPath}`);
        return outputPath;
    }

    private static createFallbackImage(outputDir: string): string {
        const imagePath = path.join(outputDir, "fallback_cover.png");
        if (!fs.existsSync(imagePath)) {
            spawnSync("ffmpeg", [
                "-y",
                "-f", "lavfi",
                "-i", "color=c=black:s=1280x720:d=1",
                "-frames:v", "1",
                imagePath
            ]);
        }
        return imagePath;
    }
}
