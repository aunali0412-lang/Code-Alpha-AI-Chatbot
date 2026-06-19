import { Router } from "express";
import path from "path";

const router = Router();

router.get("/download/project", (req, res) => {
  const file = "/tmp/ai-assistant-chat.tar.gz";
  res.setHeader("Content-Disposition", 'attachment; filename="ai-assistant-chat.tar.gz"');
  res.setHeader("Content-Type", "application/gzip");
  res.download(file, "ai-assistant-chat.tar.gz", (err) => {
    if (err) {
      res.status(404).json({ error: "File not found. Please try again." });
    }
  });
});

export default router;
