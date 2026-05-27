import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function repoSync() {
    console.log("--- Starting Track Repository Sync ---");

    // 1. Bulk Archive Outstanding Tracks
    console.log("Step 1: Bulk archiving outstanding productions...");
    spawnSync("npx", ["ts-node", "scripts/bulk_archive.ts"], { stdio: "inherit" });

    // 2. Prepare Remote Manifest Stats
    console.log("Step 2: Updating remote publishing metadata...");
    spawnSync("npx", ["ts-node", "scripts/publish_remote.ts"], { stdio: "inherit" });

    // 3. Git Push Cycle
    console.log("Step 3: Committing and pushing track changes...");
    const version = fs.readFileSync("VERSION.md", "utf-8").trim();

    spawnSync("git", ["add", "public/published", "public/registry"], { stdio: "inherit" });
    const status = spawnSync("git", ["status", "--porcelain"]).stdout.toString();

    if (status) {
        spawnSync("git", ["commit", "-m", `feat: Sync Track Repository [v${version}] [skip ci]`], { stdio: "inherit" });
        // In real environment, we'd push.
        console.log("Track changes committed locally.");
    } else {
        console.log("No new tracks to sync.");
    }

    console.log("--- Track Repository Sync Complete ---");
}

if (require.main === module) {
    repoSync().catch(console.error);
}
