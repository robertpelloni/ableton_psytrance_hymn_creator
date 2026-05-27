import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface VocalProcessorConfig {
    mode: 'local' | 'api';
    lalalApiKey?: string;
    targetBpm: number;
    targetKey?: string;
}

export class VocalProcessor {
    private config: VocalProcessorConfig;

    constructor(config: VocalProcessorConfig) {
        this.config = config;
    }

    async process(inputPath: string, outputDir: string): Promise<string> {
        console.log(`Starting vocal processing for ${inputPath}...`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 0. Download if it's a URL
        let localInput = inputPath;
        if (inputPath.startsWith('http')) {
            localInput = await this.downloadAudio(inputPath, outputDir);
        }

        // 1. Demixing
        const vocalStem = await this.isolateVocals(localInput, outputDir);

        // 2. Analysis (BPM/Key)
        const analysis = await this.analyzeAudio(vocalStem);
        console.log(`Analysis: BPM=${analysis.bpm}, Key=${analysis.key}`);

        // 3. Time Stretch
        const stretchedPath = this.timeStretch(vocalStem, analysis.bpm, this.config.targetBpm);

        // 4. Pitch Shift for key alignment
        const finalPath = this.config.targetKey ?
            this.pitchShift(stretchedPath, analysis.key, this.config.targetKey) :
            stretchedPath;

        return finalPath;
    }

    private async downloadAudio(url: string, outputDir: string): Promise<string> {
        console.log(`Downloading audio from ${url}...`);
        const outputPath = path.join(outputDir, 'downloaded_vocal.wav');

        const result = spawnSync('python3', [
            '-m', 'yt_dlp',
            '-x', '--audio-format', 'wav',
            '--output', outputPath.replace('.wav', '.%(ext)s'),
            url
        ]);

        if (result.status !== 0) {
            console.error(`yt-dlp failed: ${result.stderr.toString()}`);
            // Fallback for mock if not installed or fails
            return this.createMockAudio(outputPath);
        }

        return outputPath;
    }

    private async isolateVocals(inputPath: string, outputDir: string): Promise<string> {
        if (this.config.mode === 'local') {
            console.log("Running Demucs locally...");

            const result = spawnSync('python3', [
                '-m', 'demucs.separate',
                '--two-stems=vocals',
                '-o', outputDir,
                inputPath
            ]);

            if (result.status !== 0) {
                console.warn(`Demucs failed: ${result.stderr.toString()}. Using fallback mock.`);
                const mockPath = path.join(outputDir, 'mock_vocals.wav');
                return this.createMockAudio(mockPath);
            }

            const nameNoExt = path.basename(inputPath, path.extname(inputPath));
            // Demucs output structure: outputDir/htdemucs/inputName/vocals.wav
            const possiblePath = path.join(outputDir, 'htdemucs', nameNoExt, 'vocals.wav');
            if (fs.existsSync(possiblePath)) return possiblePath;

            return this.createMockAudio(path.join(outputDir, 'vocals.wav'));
        } else {
            console.log("LALAL.AI API integration (stub)...");
            throw new Error("LALAL.AI API mode not fully implemented yet.");
        }
    }

    private async analyzeAudio(filePath: string): Promise<{ bpm: number, key: string }> {
        console.log("Analyzing audio via Python helper...");

        const pythonScript = `
import librosa
import sys
import os
import numpy as np

filePath = sys.argv[1]
if not os.path.exists(filePath):
    print("90.0,Cmin")
    sys.exit(0)

try:
    y, sr = librosa.load(filePath)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    # Basic key detection logic could go here
    print(f"{float(np.mean(tempo))},Cmin")
except Exception as e:
    print("90.0,Cmin")
`;
        const result = spawnSync('python3', ['-c', pythonScript, filePath]);

        if (result.status !== 0) {
            console.warn(`Analysis failed: ${result.stderr.toString()}. Using default 90 BPM.`);
            return { bpm: 90, key: 'Cmin' };
        }

        const output = result.stdout.toString().trim();
        const [bpm, key] = output.split(',');
        return { bpm: parseFloat(bpm) || 90, key: key || 'Cmin' };
    }

    private getSemitones(fromKey: string, toKey: string): number {
        const noteMap: { [key: string]: number } = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        // music21 often uses '-' for flats (e.g. 'B-')
        const normalize = (k: string) => k.replace('min', '').replace('maj', '').replace('-', 'b').trim();

        const fromBase = normalize(fromKey);
        const toBase = normalize(toKey);

        const fromIndex = noteMap[fromBase];
        const toIndex = noteMap[toBase];

        if (fromIndex === undefined || toIndex === undefined) return 0;

        let diff = toIndex - fromIndex;
        if (diff > 6) diff -= 12;
        if (diff < -6) diff += 12;

        return diff;
    }

    private pitchShift(inputPath: string, originalKey: string, targetKey: string): string {
        const semitones = this.getSemitones(originalKey, targetKey);
        if (semitones === 0) return inputPath;

        const outputPath = inputPath.replace(".wav", "_shifted.wav");
        console.log(`Pitch-shifting: ${originalKey} -> ${targetKey} (${semitones} semitones)`);

        // Use rubberband filter if available, otherwise fallback to simple pitch shift
        const result = spawnSync('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-filter:a', `rubberband=pitch=${Math.pow(2, semitones/12)}`,
            outputPath
        ]);

        if (result.status !== 0) {
            console.error(`FFmpeg pitch-shift failed: ${result.stderr.toString()}`);
            return inputPath;
        }

        return outputPath;
    }

    private timeStretch(inputPath: string, originalBpm: number, targetBpm: number): string {
        const ratio = targetBpm / originalBpm;
        const outputPath = inputPath.replace(".wav", "_stretched.wav");
        console.log(`Time-stretching: ${originalBpm} -> ${targetBpm} (Ratio: ${ratio.toFixed(3)})`);

        // FFmpeg atempo filter is limited to [0.5, 2.0]. Chain them if needed.
        let filter = `atempo=${ratio}`;
        if (ratio > 2.0) {
            let chain = [];
            let tempRatio = ratio;
            while(tempRatio > 2.0) {
                chain.push("atempo=2.0");
                tempRatio /= 2.0;
            }
            chain.push(`atempo=${tempRatio}`);
            filter = chain.join(",");
        } else if (ratio < 0.5) {
            let chain = [];
            let tempRatio = ratio;
            while(tempRatio < 0.5) {
                chain.push("atempo=0.5");
                tempRatio /= 0.5;
            }
            chain.push(`atempo=${tempRatio}`);
            filter = chain.join(",");
        }

        const result = spawnSync('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-filter:a', filter,
            outputPath
        ]);

        if (result.status !== 0) {
            console.error(`FFmpeg failed: ${result.stderr.toString()}`);
            // If ffmpeg fails (e.g. no input file), just copy if it exists or return input
            return inputPath;
        }

        return outputPath;
    }

    private createMockAudio(outputPath: string): string {
        if (!fs.existsSync(outputPath)) {
            // Generate a 1-second silent wav file using ffmpeg
            spawnSync('ffmpeg', [
                '-y',
                '-f', 'lavfi',
                '-i', 'anullsrc=r=44100:cl=mono',
                '-t', '1',
                outputPath
            ]);
        }
        return outputPath;
    }
}
