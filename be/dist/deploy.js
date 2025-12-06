"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deployHtmlFileToVercel;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function deployHtmlFileToVercel(htmlFilePath, projectName = "my-vercel-project") {
    // 1. Check if HTML file exists
    if (!fs_1.default.existsSync(htmlFilePath)) {
        console.error("❌ HTML file does not exist:", htmlFilePath);
        return;
    }
    const htmlContent = fs_1.default.readFileSync(htmlFilePath, "utf-8");
    // 2. Create project folder
    const projectDir = path_1.default.join(process.cwd(), projectName);
    if (!fs_1.default.existsSync(projectDir)) {
        fs_1.default.mkdirSync(projectDir, { recursive: true });
    }
    // 3. Write index.html
    fs_1.default.writeFileSync(path_1.default.join(projectDir, "index.html"), htmlContent, {
        encoding: "utf8",
    });
    // 4. Create vercel.json
    const vercelConfig = {
        version: 2,
        builds: [{ src: "index.html", use: "@vercel/static" }],
        routes: [{ src: "/(.*)", dest: "/index.html" }],
    };
    fs_1.default.writeFileSync(path_1.default.join(projectDir, "vercel.json"), JSON.stringify(vercelConfig, null, 2), { encoding: "utf8" });
    // 5. Deploy using Vercel CLI
    const token = "1xM6wN2MvbUX1TEfvTYeQcOW";
    if (!token) {
        console.error("❌ Missing VERCEL_TOKEN environment variable");
        return;
    }
    const cmd = `vercel deploy --prod --yes --token=${token} ${projectDir}`;
    (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Deployment error:", error.message);
            return;
        }
        if (stderr && !stderr.includes("WARN")) {
            console.error("⚠️ stderr:", stderr);
        }
        console.log("\n✅ Deployment Successful!\n");
        console.log(stdout);
    });
}
// --------------------
// Example usage:
// --------------------
// deployHtmlFileToVercel("./index.html", "my-static-site");
//# sourceMappingURL=deploy.js.map