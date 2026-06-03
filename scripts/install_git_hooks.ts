import * as fs from "fs";
import * as path from "path";

/**
 * Installs Git hooks to automate manifest synchronization and integrity checks.
 */
function installHooks() {
    console.log("--- Installing Git Hooks ---");
    const hooksDir = path.join(process.cwd(), ".git/hooks");

    if (!fs.existsSync(hooksDir)) {
        console.error("Not a git repository or .git/hooks directory missing.");
        return;
    }

    const preCommitHook = path.join(hooksDir, "pre-commit");
    const hookContent = `#!/bin/sh
# Automatically reindex the manifest and check integrity before commit
echo "Running Hymnmania Integrity Hook..."
npm run reindex
npm run verify-integrity
`;

    fs.writeFileSync(preCommitHook, hookContent);
    fs.chmodSync(preCommitHook, "755");
    console.log(`Installed pre-commit hook at ${preCommitHook}`);
}

if (require.main === module) {
    installHooks();
}
