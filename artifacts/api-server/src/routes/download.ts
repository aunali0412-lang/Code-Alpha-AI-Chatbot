import { Router } from "express";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const router = Router();
const ZIP_PATH = "/tmp/ai-assistant-chat.tar.gz";
const ROOT = "/home/runner/workspace";

function buildArchive() {
  const dirs = [
    "artifacts/api-server/src",
    "artifacts/api-server/package.json",
    "artifacts/api-server/tsconfig.json",
    "artifacts/api-server/build.mjs",
    "artifacts/chatbot/src",
    "artifacts/chatbot/index.html",
    "artifacts/chatbot/package.json",
    "artifacts/chatbot/tsconfig.json",
    "artifacts/chatbot/vite.config.ts",
    "java-src",
    "lib/api-spec",
    "lib/db/src",
    "README.md",
    "replit.md",
    "package.json",
    "tsconfig.json",
    "tsconfig.base.json",
    "pnpm-workspace.yaml",
  ].join(" ");
  execSync(`cd ${ROOT} && tar -czf ${ZIP_PATH} ${dirs}`, { timeout: 30000 });
}

/** GET /api/download/project — streams the project as a downloadable archive */
router.get("/download/project", (req, res) => {
  try {
    if (!fs.existsSync(ZIP_PATH)) buildArchive();
    res.setHeader("Content-Disposition", 'attachment; filename="ai-assistant-chat.tar.gz"');
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Cache-Control", "no-cache");
    fs.createReadStream(ZIP_PATH).pipe(res);
  } catch (err) {
    req.log.error({ err }, "Download failed");
    res.status(500).json({ error: "Could not build archive" });
  }
});

export default router;
