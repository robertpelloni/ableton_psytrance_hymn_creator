import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { Midi } from "@tonejs/midi";

export interface RenderOptions {
    soundfontPath?: string;
    sampleRate?: number;
}

export class RenderingModule {
    private fluidsynthBin: string;
    private defaultSoundfont: string;

    constructor() {
        this.fluidsynthBin = "fluidsynth";
        const commonPaths = [
            "/usr/share/sounds/sf2/FluidR3_GM.sf2",
            "/usr/share/sounds/sf2/default-GM.sf2",
            "/usr/share/sounds/sf2/TimGM6mb.sf2"
        ];
        this.defaultSoundfont = commonPaths.find(p => fs.existsSync(p)) || "";
    }

    render(midiPath: string, outputPath: string, options: RenderOptions = {}): boolean {
        const sf = options.soundfontPath || this.defaultSoundfont;
        const sr = options.sampleRate || 44100;

        if (!sf || !fs.existsSync(sf)) {
            console.error(`Soundfont not found: ${sf}`);
            return false;
        }

        const args = [
            "-ni",
            "-F", outputPath,
            "-r", sr.toString(),
            sf,
            midiPath
        ];

        console.log(`[RenderingModule] Rendering to ${outputPath}...`);
        const result = spawnSync(this.fluidsynthBin, args);

        if (result.status !== 0) {
            console.error(`FluidSynth failed: ${result.stderr.toString()}`);
            return false;
        }

        return fs.existsSync(outputPath);
    }

    async renderStems(midi: Midi, outputDir: string, options: RenderOptions = {}): Promise<string[]> {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const stemFiles: string[] = [];

        for (const track of midi.tracks) {
            if (track.notes.length === 0) continue;

            const stemMidi = new Midi();
            stemMidi.header.setTempo(midi.header.tempos[0].bpm);
            const newTrack = stemMidi.addTrack();
            newTrack.name = track.name;
            track.notes.forEach(note => newTrack.addNote(note));

            const safeName = (track.name || "track").replace(/\s+/g, "_");
            const stemMidiPath = path.join(outputDir, `${safeName}.mid`);
            const stemWavPath = path.join(outputDir, `${safeName}.wav`);

            fs.writeFileSync(stemMidiPath, Buffer.from(stemMidi.toArray()));

            if (this.render(stemMidiPath, stemWavPath, options)) {
                stemFiles.push(stemWavPath);
            }

            fs.unlinkSync(stemMidiPath);
        }

        return stemFiles;
    }
}
