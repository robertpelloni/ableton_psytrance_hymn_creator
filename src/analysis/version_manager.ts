import * as fs from "fs";
import * as path from "path";

/**
 * Manages the global version and build number for the project.
 */
export class VersionManager {
    private static versionFile = path.join(process.cwd(), "VERSION.md");

    static getVersion(): string {
        if (!fs.existsSync(this.versionFile)) {
            return "1.0.0";
        }
        return fs.readFileSync(this.versionFile, "utf-8").trim();
    }

    static incrementBuild(): string {
        const current = this.getVersion();
        const parts = current.split(".");

        if (parts.length === 3) {
            const build = parseInt(parts[2]) + 1;
            const newVersion = `${parts[0]}.${parts[1]}.${build}`;
            fs.writeFileSync(this.versionFile, newVersion);
            console.log(`Version bumped: ${current} -> ${newVersion}`);
            return newVersion;
        }

        return current;
    }
}
