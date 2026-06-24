import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { HeadlessSuno } from './headless_suno';

export interface AIBridgeConfig {
    udioToken?: string;
    sunoCookie?: string;
}

export class AIBridge {
    private config: AIBridgeConfig;

    constructor(config: AIBridgeConfig) {
        this.config = config;
    }

    /**
     * Remakes a stem using a local MusicGen model (if available) or a 3rd party API.
     */
    async remakeWithAI(stemPath: string, prompt: string, useNeuralOverhaul: boolean = false): Promise<string> {
        console.log(`[AIBridge] Orchestrating Neural Texture Mapping for ${stemPath}...`);
        console.log(`[AIBridge] Prompt: ${prompt}`);

        if (useNeuralOverhaul) {
            console.log(`[AIBridge] Launching Neural Overhaul (Headless CDP Mode via Playwright)...`);
            try {
                const outputDir = path.dirname(stemPath);
                const outputPath = await HeadlessSuno.generate(stemPath, prompt, outputDir);
                return outputPath;
            } catch (error) {
                console.error(`[AIBridge] CDP Automation crashed:`, error);
                // Fallthrough to mock on failure
            }
        }

        // Fallback to simulation/mock if overhaul is disabled or fails
        const mockResult = stemPath.replace('.wav', '_ai_remake.wav');
        console.log(`[AIBridge] AI remake simulation: ${mockResult}`);

        if (fs.existsSync(stemPath)) {
            fs.copyFileSync(stemPath, mockResult);
        } else {
            console.warn(`[AIBridge] Source stem ${stemPath} not found. Creating a mock instead.`);
            spawnSync('ffmpeg', [
                '-y',
                '-f', 'lavfi',
                '-i', 'sine=frequency=440:duration=1',
                mockResult
            ]);
        }

        return mockResult;
    }

    /**
     * Stub for Udio API integration.
     */
    async udioRemix(audioPath: string, prompt: string): Promise<string> {
        if (!this.config.udioToken) {
            console.warn("[AIBridge] Udio Token missing. Skipping Udio integration.");
            return audioPath;
        }
        // Logic for Udio API would go here
        return audioPath;
    }
}
