---
name: Gemini integration workaround
description: Why api-server imports @google/genai directly instead of @workspace/integrations-gemini-ai
---

## Rule

In `artifacts/api-server`, import `@google/genai` directly. Do NOT import from `@workspace/integrations-gemini-ai`.

**Why:** `lib/integrations-gemini-ai/src/image/client.ts` throws at module load time when `AI_INTEGRATIONS_GEMINI_BASE_URL` is not set (Replit AI integration not provisioned). This env var is only available on paid Replit plans. The image client is re-exported by the barrel `index.ts`, so any import from `@workspace/integrations-gemini-ai` triggers the throw even if image generation is never used.

**How to apply:**
1. Add `"@google/genai": "^1.44.0"` to `artifacts/api-server/package.json` `dependencies`.
2. In route files, use: `import { GoogleGenAI } from "@google/genai";`
3. Initialize with: `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`
4. esbuild externalizes `@google/*` — the package resolves from `node_modules` at runtime, so it must be installed (run `pnpm install`).
