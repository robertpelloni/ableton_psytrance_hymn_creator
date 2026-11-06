import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

const radioRouter = express.Router();

/**
 * Continuous Radio Stream endpoint for Psytrance Hymns.
 * Streams published audio files using ffmpeg for proper throttling and audio/mpeg encoding.
 */
radioRouter.get('/', (req: Request, res: Response) => {
    const manifestPath = path.resolve('public/published/manifest.json');
    if (!fs.existsSync(manifestPath)) {
        return res.status(404).send('Radio offline: No published tracks available.');
    }

    let tracks: any[] = [];
    try {
        tracks = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
        return res.status(500).send('Radio offline: Corrupt manifest.');
    }

    if (tracks.length === 0) {
        return res.status(404).send('Radio offline: Empty library.');
    }

    const wantsIcy = req.headers['icy-metadata'] === '1';
    const icyMetaInt = 16384; // Inject metadata every 16384 bytes of audio

    const headers: Record<string, string> = {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Powered-By': 'Hymnmania Radio Engine'
    };

    if (wantsIcy) {
        headers['icy-name'] = 'Hymnmania 24/7 Psy-Hymn Radio';
        headers['icy-metaint'] = icyMetaInt.toString();
        headers['icy-pub'] = '1';
        headers['icy-description'] = 'Autonomous Neural Psytrance Broadcasting';
    }

    res.writeHead(200, headers);

    console.log(`[Radio] Client connected to live stream (Icy-MetaData: ${wantsIcy ? 'yes' : 'no'}). ${tracks.length} tracks available.`);

    let isClientConnected = true;
    let currentFfmpegProcess: ChildProcess | null = null;
    let byteCounter = 0;

    req.on('close', () => {
        isClientConnected = false;
        console.log('[Radio] Client disconnected.');
        if (currentFfmpegProcess && !currentFfmpegProcess.killed) {
            console.log('[Radio] Killing active FFmpeg process due to disconnect.');
            currentFfmpegProcess.kill('SIGKILL');
        }
    });

    const streamNextTrack = () => {
        if (!isClientConnected) return;

        // Pick a random track from the manifest
        const track = tracks[Math.floor(Math.random() * tracks.length)];
        const audioPath = path.join('public/published', track.fileName || track.originalFileName);

        if (!fs.existsSync(audioPath)) {
            console.warn(`[Radio] Track file missing: ${audioPath}. Skipping...`);
            return setTimeout(streamNextTrack, 1000);
        }

        const streamTitle = `StreamTitle='${track.title || 'Unknown Track'} - ${track.artist || 'Hymnmania AI'}';`;
        console.log(`[Radio] Now playing: ${streamTitle}`);

        // Spawn FFmpeg to stream at 1x real-time speed (-re) and convert to 192k mp3
        currentFfmpegProcess = spawn('ffmpeg', [
            '-re',                  // Read input at native frame rate (throttling)
            '-i', audioPath,        // Input file
            '-c:a', 'libmp3lame',   // Audio codec
            '-b:a', '192k',         // Audio bitrate
            '-f', 'mp3',            // Output format
            '-'                     // Output to stdout
        ]);

        if (currentFfmpegProcess.stdout) {
            if (wantsIcy) {
                currentFfmpegProcess.stdout.on('data', (chunk: Buffer) => {
                    if (!isClientConnected) return;

                    let offset = 0;
                    while (offset < chunk.length) {
                        const remainingToMeta = icyMetaInt - byteCounter;
                        const chunkRemaining = chunk.length - offset;
                        const writeLen = Math.min(remainingToMeta, chunkRemaining);

                        const canWrite = res.write(chunk.subarray(offset, offset + writeLen));

                        if (!canWrite && currentFfmpegProcess?.stdout) {
                            currentFfmpegProcess.stdout.pause();
                            res.once('drain', () => {
                                if (isClientConnected && currentFfmpegProcess?.stdout) {
                                    currentFfmpegProcess.stdout.resume();
                                }
                            });
                        }

                        byteCounter += writeLen;
                        offset += writeLen;

                        if (byteCounter >= icyMetaInt) {
                            // Inject metadata block
                            // The metadata block length must be a multiple of 16 bytes.
                            // The first byte represents the length of the metadata block divided by 16.
                            let metaString = streamTitle;
                            const paddingLength = 16 - (metaString.length % 16);
                            if (paddingLength < 16) {
                                metaString += '\0'.repeat(paddingLength);
                            }
                            const metaLengthByte = metaString.length / 16;

                            const metaBuffer = Buffer.alloc(1 + metaString.length);
                            metaBuffer.writeUInt8(metaLengthByte, 0);
                            metaBuffer.write(metaString, 1, 'ascii');

                            res.write(metaBuffer);
                            byteCounter = 0;
                        }
                    }
                });
            } else {
                currentFfmpegProcess.stdout.pipe(res, { end: false });
            }
        }

        currentFfmpegProcess.on('error', (err) => {
            console.error(`[Radio] FFmpeg process error:`, err);
            if (isClientConnected) {
                setTimeout(streamNextTrack, 1000);
            }
        });

        currentFfmpegProcess.on('close', (code) => {
            if (isClientConnected) {
                console.log(`[Radio] Track finished (code ${code}). Queuing next...`);
                // Slight crossfade delay simulation
                setTimeout(streamNextTrack, 500);
            }
        });
    };

    // Start infinite streaming loop
    streamNextTrack();
});

export default radioRouter;
