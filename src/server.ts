import express, { Request, Response } from 'express';
import { PsyMonoPipeline, PipelineOptions } from './pipeline';
import * as path from 'path';
import * as fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

/**
 * REST API for the Hymnmania Production Pipeline
 */

// POST /generate - Triggers a new music generation run
app.post('/generate', async (req: Request, res: Response) => {
    console.log(`[API] Received generation request:`, req.body);

    const options: PipelineOptions = {
        inputMidi: req.body.inputMidi,
        outputDir: req.body.outputDir || path.join('pipeline/output', `run-${Date.now()}`),
        genre: req.body.genre || 'psytrance',
        targetBpm: req.body.bpm ? parseInt(req.body.bpm) : (req.body.genre === 'house' ? 124 : 145),
        vocalTrack: req.body.vocalTrack,
        useAi: req.body.useAi || false,
        mood: req.body.mood,
        continuous: req.body.continuous || false,
        psyConfig: req.body.psyConfig
    };

    const pipeline = new PsyMonoPipeline();

    // Run pipeline asynchronously to avoid blocking the API response
    // In a real production system, this would be queued (e.g., BullMQ/Redis)
    pipeline.run(options)
        .then(() => {
            console.log(`[API] Pipeline run complete for ${options.outputDir}`);
        })
        .catch(err => {
            console.error(`[API] Pipeline failed:`, err);
        });

    res.status(202).json({
        success: true,
        message: "Generation triggered successfully",
        outputDir: options.outputDir,
        statusUrl: `/status?dir=${encodeURIComponent(options.outputDir)}`
    });
});

// GET /status - Simple polling endpoint for job status
app.get('/status', (req: Request, res: Response) => {
    const outputDir = req.query.dir as string;
    if (!outputDir) {
        return res.status(400).json({ error: "Missing 'dir' parameter" });
    }

    // Security: Validate that the directory is within the expected pipeline/output base
    const absoluteOutputDir = path.resolve(outputDir);
    const absoluteBaseDir = path.resolve("pipeline/output");
    if (!absoluteOutputDir.startsWith(absoluteBaseDir)) {
        return res.status(403).json({ error: "Access denied: Invalid output directory scope." });
    }

    const videoPath = path.join(outputDir, "video.mp4");
    const audioPath = path.join(outputDir, "structure.wav");
    const manifestPath = path.join("public/published/manifest.json");

    let status = "processing";
    let result = null;

    if (fs.existsSync(videoPath)) {
        status = "completed";
        // Try to find the published fileName in manifest
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            result = manifest.find((t: any) => t.title && outputDir.includes(t.title.replace(/\s+/g, "_")));
        }
    }

    res.json({
        status,
        outputDir,
        result
    });
});

app.listen(port, () => {
    console.log(`[API] Hymnmania Pipeline API listening at http://localhost:${port}`);
});

export default app;
