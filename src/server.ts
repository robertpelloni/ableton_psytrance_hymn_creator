import express, { Request, Response } from 'express';
import { PsyMonoPipeline, PipelineOptions } from './pipeline';
import * as path from 'path';
import * as fs from 'fs';
import { MasteringService } from './services/mastering/mastering_service';
import radioRouter from './streaming/radio_server';

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
        targetBpm: req.body.bpm ? parseInt(req.body.bpm) :
            (req.body.genre === 'house' ? 124 :
             req.body.genre === 'techno' ? 130 :
             req.body.genre === 'trance' ? 138 :
             req.body.genre === 'hardstyle' ? 150 : 145),
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

// POST /api/v1/master - Triggers the standalone neural mastering engine
app.post('/api/v1/master', async (req: Request, res: Response) => {
    if (process.env.MASTERING_ENABLED === 'false') {
        return res.status(503).json({ error: "Mastering Engine is disabled." });
    }

    console.log(`[API] Received mastering request:`, req.body);
    const { audioUrl, profile } = req.body;

    if (!audioUrl) {
        return res.status(400).json({ error: "Missing required parameter 'audioUrl'." });
    }

    const targetProfile = profile || 'psytrance';

    try {
        const masteredPath = await MasteringService.process(audioUrl, targetProfile);
        res.status(200).json({
            success: true,
            message: "Neural Mastering Complete",
            masteredAudioPath: masteredPath
        });
    } catch (err: any) {
        console.error(`[API] Mastering request failed:`, err);
        res.status(500).json({
            success: false,
            error: err.message || "Internal server error during mastering process."
        });
    }
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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Mount the live radio stream
app.use('/radio', radioRouter);

app.listen(port, () => {
    console.log(`[API] Hymnmania Pipeline API listening at http://localhost:${port}`);
    console.log(`[API] Radio Stream available at http://localhost:${port}/radio`);
});

export default app;
