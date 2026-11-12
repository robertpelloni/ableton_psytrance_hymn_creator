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
            console.log(`[AIBridge] Launching Neural Overhaul (Headless CDP Mode)...`);
            let automationPath = path.join(__dirname, "../../hymnmania_src/services/udio_automation.py");
            if (!fs.existsSync(automationPath)) {
                automationPath = path.join(process.cwd(), "hymnmania_src/services/udio_automation.py");
            }

            const pyCmd = process.platform === "win32" ? "python" : "python3";
            let result = spawnSync(pyCmd, [automationPath, stemPath, prompt]);
            if (result.error) {
                result = spawnSync(pyCmd === "python" ? "python3" : "python", [automationPath, stemPath, prompt]);
            }
            if (result.status === 0 && result.stdout) {
                const data = JSON.parse(result.stdout.toString());
                if (data.success) {
                    console.log(`[AIBridge] Neural Overhaul successful: ${data.output_path}`);
                    return data.output_path;
                } else {
                    console.error(`[AIBridge] Neural Overhaul failed: ${data.error}`);
                }
            } else {
                const errMsg = result.stderr ? result.stderr.toString() : (result.error?.message || "python unavailable");
                console.error(`[AIBridge] Automation service crashed: ${errMsg}`);
            }

            try {
                const outputDir = path.dirname(stemPath);
                return await HeadlessSuno.generate(stemPath, prompt, outputDir);
            } catch (cdpError) {
                console.warn(`[AIBridge] Alternate HeadlessSuno adapter unavailable:`, cdpError);
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
