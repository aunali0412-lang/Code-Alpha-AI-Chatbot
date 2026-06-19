# CodeAlpha AI Chatbot

A professional AI Chatbot built for the CodeAlpha internship. ChatGPT-like UI with NLP-based FAQ matching (TF-IDF cosine similarity) and Google Gemini AI fallback.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `GEMINI_API_KEY` — Google Gemini API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: Google Gemini 2.5 Flash (`@google/genai` directly in api-server)
- NLP: Custom TF-IDF + cosine similarity (`artifacts/api-server/src/lib/nlp.ts`)
- Frontend: React 19 + Vite + Tailwind CSS

## Where things live

- `artifacts/api-server/src/routes/gemini/index.ts` — conversation + SSE streaming endpoint
- `artifacts/api-server/src/routes/faq/index.ts` — FAQ NLP match endpoint
- `artifacts/api-server/src/lib/nlp.ts` — TF-IDF engine (tokenize, IDF, cosine similarity)
- `artifacts/api-server/src/lib/faqs.ts` — 40 FAQ dataset entries
- `artifacts/chatbot/src/` — React frontend (Sidebar, ChatArea, MessageBubble, ChatInput)
- `java-src/` — Java reference implementation for internship evaluation
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle ORM schema (conversations, messages)

## Architecture decisions

- **NLP-first**: Every user message runs TF-IDF cosine similarity against 40 FAQs before hitting Gemini. FAQ threshold = 0.18.
- **SSE streaming**: Both FAQ answers (word-by-word) and Gemini responses stream via Server-Sent Events for real-time typing effect.
- **Direct `@google/genai`**: The API server imports `@google/genai` directly (NOT via `@workspace/integrations-gemini-ai`) because `lib/integrations-gemini-ai/src/image/client.ts` throws at import time when `AI_INTEGRATIONS_GEMINI_BASE_URL` is unset.
- **DB persistence**: All conversations and messages stored in PostgreSQL; sidebar loads from DB on mount.
- **Java reference**: `java-src/` mirrors the TypeScript NLP + Gemini logic for CodeAlpha internship evaluation.

## Product

- Create and manage multiple chat conversations (sidebar with date grouping)
- Ask questions — FAQ questions answered instantly via TF-IDF NLP; unknown questions answered by Gemini AI
- Streaming responses with typing animation
- Voice input (Web Speech API), text-to-speech for bot replies
- Dark/light theme toggle
- Export chat as text file
- Responsive mobile + desktop layout

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Do NOT import from `@workspace/integrations-gemini-ai`** in the api-server — the image sub-module throws at startup when Replit AI integration env vars are missing. Use `@google/genai` directly.
- `@google/genai` must be a direct `dependency` in `artifacts/api-server/package.json` (it's externalized in esbuild and must be present in node_modules at runtime).
- esbuild externalizes `@google/*` — so the package must be installed in `artifacts/api-server/node_modules/@google/genai/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
