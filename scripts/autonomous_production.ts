import { spawnSync } from "child_process";
import * as fs from "fs";

/**
 * Master Script: Autonomous AI Music Production and Repository Management.
 * Orchestrates the full lifecycle: sanitize -> produce -> archive -> index -> remote sync -> deploy -> git push.
 */
async function autonomousProduction() {
    console.log("======================================================");
    console.log("   AUTONOMOUS PRODUCTION CYCLE STARTING...");
    console.log("======================================================");

    const exec = (cmd: string, args: string[]) => {
        console.log(`\n[MASTER] Executing: ${cmd} ${args.join(" ")}`);
        const result = spawnSync(cmd, args, { stdio: "inherit" });
        if (result.status !== 0) {
            console.error(`\n[MASTER] Command failed with status: ${result.status}`);
            process.exit(result.status || 1);
        }
    };

    // 1. Repository Sanitization
    exec("npx", ["ts-node", "scripts/repository_sanitizer.ts"]);

    // 2. Production Pipeline (Continuous Mode)
    // We run it for one track in this master script cycle
    exec("npx", ["ts-node", "src/pipeline.ts", "--continuous", "pipeline/output/latest", "--use-ai"]);

    // 3. Remote Synchronization (Audio & Artifacts)
    exec("npx", ["ts-node", "scripts/sync_remote.ts"]);

    // 4. Deployment Metadata & Indexing
    exec("npx", ["ts-node", "scripts/publish_remote.ts"]);

    // 5. Track Repository Sync (Git Commit & Push)
    exec("npx", ["ts-node", "scripts/track_repository_sync.ts"]);

    console.log("\n======================================================");
    console.log("   AUTONOMOUS PRODUCTION CYCLE COMPLETED.");
    console.log("======================================================");
}

if (require.main === module) {
    autonomousProduction().catch(console.error);
}
