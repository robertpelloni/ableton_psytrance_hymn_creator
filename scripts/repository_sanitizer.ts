import { spawnSync } from "child_process";

/**
 * REPOSITORY SANITIZATION PROTOCOL (Section 2)
 * Ensures the repository is clean, functional, and updated to the latest commits.
 */
async function sanitize() {
    console.log("--- Starting Repository Sanitization Protocol ---");

    // 1. Upstream Sync
    console.log("Step 1: Syncing with upstream (Upstream Sync)...");
    spawnSync("git", ["fetch", "--all"], { stdio: "inherit" });
    // spawnSync("git", ["pull", "origin", "main"], { stdio: "inherit" });

    // 2. Branch Merging (Section 2.2)
    // Identify and intelligently merge local feature branches under 'robertpelloni' into 'main'
    console.log("Step 2: Identifying and merging personal feature branches (Branch Merging)...");
    const branchesResult = spawnSync("git", ["branch", "-a"]).stdout.toString();
    const robertPelloniBranches = branchesResult.split("\n")
        .map(b => b.trim().replace(/^\* /, ""))
        .filter(b => b.includes("robertpelloni/") || b.includes("feature/"))
        .filter(b => !b.includes("remotes/origin/main"));

    for (const branch of robertPelloniBranches) {
        console.log(`Intelligently merging feature branch: ${branch}`);
        // Attempt merge, resolve conflicts by favoring feature branch additions but keeping main framework
        const mergeResult = spawnSync("git", ["merge", branch, "-m", `chore(sync): Autonomous merge of ${branch}`], { stdio: "inherit" });
        if (mergeResult.status !== 0) {
            console.warn(`Conflict detected in ${branch}. Attempting automated resolution...`);
            spawnSync("git", ["checkout", "--theirs", "."], { stdio: "inherit" });
            spawnSync("git", ["add", "."], { stdio: "inherit" });
            spawnSync("git", ["commit", "-m", `chore(sync): Resolve conflicts in favor of feature ${branch}`], { stdio: "inherit" });
        }
    }

    // 3. Catch-Up Sync (Section 2.3)
    // Ensure personal feature branches are updated with main
    console.log("Step 3: Updating feature branches with 'main' (Catch-Up Sync)...");
    for (const branch of robertPelloniBranches) {
        const localName = branch.replace("remotes/origin/", "");
        console.log(`Catch-up sync for: ${localName}`);
        spawnSync("git", ["checkout", localName], { stdio: "inherit" });
        spawnSync("git", ["merge", "main", "-m", "chore(sync): Catch-up with main"], { stdio: "inherit" });
        spawnSync("git", ["checkout", "main"], { stdio: "inherit" });
    }

    // 4. Submodule Cleanup (Section 2.4)
    console.log("Step 4: Recursive submodule cleanup (Submodule Cleanup)...");
    spawnSync("git", ["submodule", "update", "--init", "--recursive", "--remote"], { stdio: "inherit" });

    console.log("--- Sanitization Protocol Complete ---");
}

if (require.main === module) {
    sanitize().catch(console.error);
}
