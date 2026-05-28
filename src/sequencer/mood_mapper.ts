import { PsyConfig, DEFAULT_PSY_CONFIG } from "./psy_generator";

export type Mood = "uplifting" | "dark" | "energetic" | "solemn" | "mystical";

export interface MoodParameters {
    bpmOffset: number;
    densityBias: number;
    velocityBias: number;
    octaveBias: number;
    aiPromptAddon: string;
}

const MOOD_MAP: Record<Mood, MoodParameters> = {
    uplifting: {
        bpmOffset: 3,
        densityBias: 1,
        velocityBias: 0.1,
        octaveBias: 1,
        aiPromptAddon: "uplifting morning vibes, major key brightness, shimmering pads"
    },
    dark: {
        bpmOffset: -2,
        densityBias: -1,
        velocityBias: -0.1,
        octaveBias: -1,
        aiPromptAddon: "dark forest atmosphere, deep shadows, resonant FM leads"
    },
    energetic: {
        bpmOffset: 5,
        densityBias: 2,
        velocityBias: 0.2,
        octaveBias: 1,
        aiPromptAddon: "high energy, aggressive transients, driving velocity"
    },
    solemn: {
        bpmOffset: -10,
        densityBias: -2,
        velocityBias: -0.2,
        octaveBias: -1,
        aiPromptAddon: "solemn echoes, reverent space, minimal percussion"
    },
    mystical: {
        bpmOffset: 0,
        densityBias: 0,
        velocityBias: 0,
        octaveBias: 0,
        aiPromptAddon: "mystical textures, otherworldly delays, complex phasing"
    }
};

export class MoodMapper {
    static applyMood(config: PsyConfig, mood: Mood): PsyConfig {
        const params = MOOD_MAP[mood];
        if (!params) return config;

        return {
            ...config,
            targetBpm: config.targetBpm + params.bpmOffset,
            euclideanDensity: Math.max(1, Math.min(8, config.euclideanDensity + params.densityBias)),
            bassVelocity: Math.max(0.1, Math.min(1.0, config.bassVelocity + params.velocityBias)),
            leadVelocity: Math.max(0.1, Math.min(1.0, config.leadVelocity + params.velocityBias)),
            octaveJumpBarFrequency: Math.max(0, Math.min(4, config.octaveJumpBarFrequency + params.octaveBias))
        };
    }

    static getPromptAddon(mood: Mood): string {
        return MOOD_MAP[mood]?.aiPromptAddon || "";
    }
}
