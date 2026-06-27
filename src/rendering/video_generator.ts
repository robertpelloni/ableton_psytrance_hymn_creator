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

        // Use FFmpeg complex filter for audio-reactive visuals (waveform + vectorscope)
        const result = spawnSync("ffmpeg", [
            "-y",
            "-loop", "1",
            "-i", imagePath,
            "-i", audioPath,
            "-filter_complex",
            "[1:a]showwaves=s=1280x200:mode=line:colors=cyan|blue[v_wave];" +
            "[1:a]avectorscope=s=300x300:zoom=1.5:rc=0:gc=200:bc=255[v_scope];" +
            "[0:v][v_wave]overlay=0:H-h[v_tmp];" +
            "[v_tmp][v_scope]overlay=W-w-20:20[v_final]",
            "-map", "[v_final]",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
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

    /**
     * Generates a 9:16 vertical video for YouTube Shorts and Instagram Reels.
     */
    static generateVertical(audioPath: string, imagePath: string, outputPath: string): string {
        console.log(`Generating vertical music video for: ${audioPath}`);

        if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`);
        if (!fs.existsSync(imagePath)) {
            console.warn(`Cover image not found at ${imagePath}. Using fallback black image.`);
            imagePath = this.createFallbackImageVertical(path.dirname(outputPath));
        }

        // 9:16 format is usually 1080x1920
        // We'll scale/crop the cover to fit 1080x1920, then overlay waveform and avectorscope
        const result = spawnSync("ffmpeg", [
            "-y",
            "-loop", "1",
            "-i", imagePath,
            "-i", audioPath,
            "-filter_complex",
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];" + // blurred background
            "[0:v]scale=1080:1080:force_original_aspect_ratio=decrease[fg];" + // center square cover
            "[bg][fg]overlay=(W-w)/2:(H-h)/2-200[v_base];" +
            "[1:a]showwaves=s=1080x300:mode=line:colors=cyan|blue[v_wave];" +
            "[1:a]avectorscope=s=400x400:zoom=1.5:rc=0:gc=200:bc=255[v_scope];" +
            "[v_base][v_wave]overlay=0:H-h-300[v_tmp];" +
            "[v_tmp][v_scope]overlay=(W-w)/2:H-h-50[v_final]",
            "-map", "[v_final]",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            outputPath
        ]);

        if (result.status !== 0) {
            console.error(`FFmpeg vertical video generation failed: ${result.stderr.toString()}`);
            throw new Error("Vertical video generation failed");
        }

        console.log(`Vertical video generated at: ${outputPath}`);
        return outputPath;
    }

    private static createFallbackImageVertical(outputDir: string): string {
        const imagePath = path.join(outputDir, "fallback_cover_vertical.png");
        if (!fs.existsSync(imagePath)) {
            spawnSync("ffmpeg", [
                "-y",
                "-f", "lavfi",
                "-i", "color=c=black:s=1080x1920:d=1",
                "-frames:v", "1",
                imagePath
            ]);
        }
        return imagePath;
    }
}
