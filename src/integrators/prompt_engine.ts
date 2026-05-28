import { HymnDNA } from "../analysis/midi_parser";
import { Mood, MoodMapper } from "../sequencer/mood_mapper";

export class PromptEngine {
    /**
     * Generates a descriptive AI sound design prompt based on the musical DNA and target genre/mood.
     */
    static generate(dna: HymnDNA, genre: "psytrance" | "house", mood?: Mood): string {
        let basePrompt = "";

        if (genre === "psytrance") {
            basePrompt = "Modern Full-On Psytrance, 145 BPM, driving, psychedelic sound design, festival grade master, Access Virus TI style leads, FM lasers";
        } else {
            basePrompt = "Deep House, 124 BPM, soulful, smooth textures, professional club master, warm analog chords, rhythmic deep house groove";
        }

        // Add harmonic context
        const keyInfo = `key of ${dna.key}`;
        basePrompt += `, ${keyInfo}`;

        // Add mood-specific descriptors
        if (mood) {
            const moodAddon = MoodMapper.getPromptAddon(mood);
            if (moodAddon) {
                basePrompt += `, ${moodAddon}`;
            }
        }

        return basePrompt;
    }
}
