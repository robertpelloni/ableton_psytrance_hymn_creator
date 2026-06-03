import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * MASTER AUTONOMOUS PRODUCTION ORCHESTRATOR
 * This script centralizes the full "one-command" lifecycle from
 * repository sanitization to final deployment.
 */
async function orchestrateProduction() {
    console.log("--- [MASTER ORCHESTRATION] Initializing Autonomous Production Cycle ---");

    // 1. Repository Sanitization (Section 2)
    console.log("\n[1/5] Executing Repository Sanitization Protocol...");
    spawnSync("npx", ["ts-node", "scripts/repository_sanitizer.ts"], { stdio: "inherit" });

    // 2. Production Pipeline (Core)
    // Runs in continuous mode to produce a new track
    console.log("\n[2/5] Running Music Generation Pipeline (Continuous Mode)...");
    const timestamp = Date.now();
    const outputDir = path.join("pipeline/output", `auto-${timestamp}`);

    // Choose random genre for variation
    const genre = Math.random() > 0.5 ? "psytrance" : "house";
    const bpm = genre === "house" ? 124 : 145;

    spawnSync("npx", ["ts-node", "src/pipeline.ts", "--continuous", outputDir, "--genre", genre, "--bpm", bpm.toString()], { stdio: "inherit" });

    // 3. Vault Sync & Archiving (Section 2 & 6)
    console.log("\n[3/5] Executing Vault Sync & Archiving Protocol...");
    spawnSync("npx", ["ts-node", "scripts/autonomous_vault_sync.ts"], { stdio: "inherit" });

    // 4. Automated Streaming Publishing (1.7.1 Workflow)
    console.log("\n[4/5] Executing Automated Streaming Publishing Workflow...");
    spawnSync("npx", ["ts-node", "scripts/publish_streaming.ts"], { stdio: "inherit" });

    // 5. Final Deployment & Metadata Sync
    console.log("\n[5/5] Finalizing Deployment and Repository Stats...");
    spawnSync("npm", ["run", "deploy"], { stdio: "inherit" });

    console.log("\n--- [MASTER ORCHESTRATION] Autonomous Cycle Complete ---");
}

if (require.main === module) {
    orchestrateProduction().catch(console.error);
}
