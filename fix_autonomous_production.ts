import * as fs from 'fs';

const content = fs.readFileSync('scripts/autonomous_production.ts', 'utf8');

// Replace continuous mode with standard generation for the test so it doesn't time out
const newContent = content.replace(
    'spawnSync("npx", ["ts-node", "src/pipeline.ts", "--continuous", outputDir, "--genre", genre, "--bpm", bpm.toString()], { stdio: "inherit" });',
    'spawnSync("npx", ["ts-node", "src/pipeline.ts", "public/registry/canary_verification.mid", outputDir, "--genre", genre, "--bpm", bpm.toString()], { stdio: "inherit" });'
);

fs.writeFileSync('scripts/autonomous_production.ts', newContent);
