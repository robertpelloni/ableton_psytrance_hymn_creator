import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import * as glob from "glob";

export class TrainingEngine {
    static train(corpusDir: string, modelOutputPath: string) {
        console.log(`Starting style model training on corpus: ${corpusDir}`);

        let analyzerPath = path.join(__dirname, "style_modeler.py");
        if (!fs.existsSync(analyzerPath)) {
            analyzerPath = path.join(process.cwd(), "src/analysis/style_modeler.py");
        }
        const result = spawnSync("python3", [analyzerPath, corpusDir, modelOutputPath]);

        if (result.status === 0) {
            console.log(`Training complete. Model saved to: ${modelOutputPath}`);
        } else {
            console.error(`Training failed: ${result.stderr.toString()}`);
        }
    }
}

if (require.main === module) {
    const corpus = "hymnmania_src";
    const output = "models/hymn_style_v1.json";
    if (!fs.existsSync("models")) fs.mkdirSync("models");
    TrainingEngine.train(corpus, output);
}
