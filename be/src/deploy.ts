import { exec } from "child_process";
import fs from "fs";
import path from "path";

interface VercelConfig {
  version: 2; // must be 2
  builds: { src: string; use: string }[];
  routes: { src: string; dest: string }[];
}

export default function deployHtmlFileToVercel(
  htmlFilePath: string,
  projectName: string = "my-vercel-project"
): void {
  // 1. Check if HTML file exists
  if (!fs.existsSync(htmlFilePath)) {
    console.error("❌ HTML file does not exist:", htmlFilePath);
    return;
  }
  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  // 2. Create project folder
  const projectDir = path.join(process.cwd(), projectName);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // 3. Write index.html
  fs.writeFileSync(path.join(projectDir, "index.html"), htmlContent, {
    encoding: "utf8",
  });

  // 4. Create vercel.json
  const vercelConfig: VercelConfig = {
    version: 2,
    builds: [{ src: "index.html", use: "@vercel/static" }],
    routes: [{ src: "/(.*)", dest: "/index.html" }],
  };

  fs.writeFileSync(
    path.join(projectDir, "vercel.json"),
    JSON.stringify(vercelConfig, null, 2),
    { encoding: "utf8" }
  );

  // 5. Deploy using Vercel CLI
  const token = "1xM6wN2MvbUX1TEfvTYeQcOW"

  if (!token) {
    console.error("❌ Missing VERCEL_TOKEN environment variable");
    return;
  }

  const cmd = `vercel deploy --prod --yes --token=${token} ${projectDir}`;

  exec(cmd, (error, stdout, stderr) => {
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
