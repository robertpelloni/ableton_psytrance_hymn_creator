import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Autonomous Vault Sync Orchestrator
 * Implements Section 2 (Sanitization) and Section 6 (Sync/Handoff)
 * protocols for the Hymnmania repository.
 */
async function orchestrateVaultSync() {
    console.log("--- [AUTONOMOUS VAULT SYNC] Initializing ---");

    // 1. Repository Sanitization Protocol (Section 2)
    console.log("\n[Protocol] Step 1: Executing Repository Sanitization...");
    const sanitizeResult = spawnSync("npx", ["ts-node", "scripts/repository_sanitizer.ts"], { stdio: "inherit" });
    if (sanitizeResult.status !== 0) {
        console.error("Sanitization failed. Proceeding with caution...");
    }

    // 2. Bulk Archive Outstanding Productions
    console.log("\n[Protocol] Step 2: Archiving and Registry Updates...");
    spawnSync("npx", ["ts-node", "scripts/bulk_archive.ts"], { stdio: "inherit" });

    // 3. Re-indexing Registry (Search Optimization)
    console.log("\n[Protocol] Step 3: Re-indexing Registry for Search Performance...");
    spawnSync("npx", ["ts-node", "scripts/reindex_registry.ts"], { stdio: "inherit" });

    // 4. Remote Storage Synchronization
    console.log("\n[Protocol] Step 4: Syncing Assets to Remote Cloud Vault...");
    spawnSync("npx", ["ts-node", "scripts/sync_remote.ts"], { stdio: "inherit" });

    // 5. Statistics and Metadata Deployment
    console.log("\n[Protocol] Step 5: Finalizing Metadata and Stats Deployment...");
    spawnSync("npx", ["ts-node", "scripts/publish_remote.ts"], { stdio: "inherit" });

    // 6. Automated Git Commit & Push (Section 6)
    console.log("\n[Protocol] Step 6: Committing Vault State to Git...");
    const version = fs.readFileSync("VERSION.md", "utf-8").trim();

    spawnSync("git", ["add", "public/published", "public/registry", "public/models", "CHANGELOG.md", "VERSION.md"], { stdio: "inherit" });
    const status = spawnSync("git", ["status", "--porcelain"]).stdout.toString();

    if (status) {
        const commitMsg = `feat(vault): Synchronize Production Vault [v${version}] [skip ci]`;
        spawnSync("git", ["commit", "-m", commitMsg], { stdio: "inherit" });
        console.log(`Vault changes committed: ${commitMsg}`);
        // spawnSync("git", ["push"], { stdio: "inherit" }); // Uncomment in live environment
    } else {
        console.log("No changes detected in Vault. Git state clean.");
    }

    console.log("\n--- [AUTONOMOUS VAULT SYNC] Complete ---");
}

if (require.main === module) {
    orchestrateVaultSync().catch(console.error);
}
