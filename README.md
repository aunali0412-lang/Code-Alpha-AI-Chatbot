# CodeAlpha AI Chatbot

A professional AI Chatbot built for the **CodeAlpha Internship** program. Features a ChatGPT-like interface with NLP-powered FAQ matching and Google Gemini AI integration.

## Features

- **ChatGPT-like Interface** — Dark/light theme, chat bubbles, avatars, typing animation, auto-scroll
- **Sidebar** — Chat history with date grouping, clear/delete, collapse
- **NLP FAQ Matching** — TF-IDF vectorization + cosine similarity (no external ML library needed)
- **Gemini AI** — Falls back to Gemini 2.5 Flash when no FAQ match is found
- **Streaming Responses** — Real-time SSE streaming with typing effect
- **Voice Input** — Web Speech API (microphone input)
- **Text-to-Speech** — Browser speech synthesis for bot replies
- **Export** — Download chat as text file
- **Responsive** — Mobile and desktop layouts

## NLP Pipeline

```
User Query
    ↓
Tokenization (split into words)
    ↓
Lowercase Conversion
    ↓
Stop-Word Removal (150+ stop words)
    ↓
TF-IDF Vectorization (per query + all FAQs)
    ↓
Cosine Similarity (query vs. each FAQ)
    ↓
Best Match (score ≥ 0.18 threshold)
    ↓
FAQ Answer  ──OR──  Gemini AI Fallback
```

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Node.js/TypeScript backend (Express)
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── gemini/  # Conversation + message endpoints
│   │       │   └── faq/     # NLP FAQ matching endpoint
│   │       └── lib/
│   │           ├── nlp.ts   # TF-IDF cosine similarity engine
│   │           └── faqs.ts  # FAQ dataset (40 entries)
│   └── chatbot/             # React + Vite frontend
│       └── src/
│           ├── components/  # Sidebar, MessageBubble, ChatInput, ChatArea
│           ├── hooks/       # useChat, useTheme
│           └── lib/         # utils (markdown parser, formatters)
├── java-src/                # Java source files (internship reference)
│   └── src/main/java/com/codealpha/chatbot/
│       ├── model/           # Message, Conversation, FaqEntry
│       ├── nlp/             # NlpEngine, FaqMatcher (TF-IDF)
│       ├── service/         # ChatService, GeminiService
│       └── controller/      # ChatController (MVC)
└── lib/
    ├── api-spec/            # OpenAPI specification
    ├── api-client-react/    # Generated React Query hooks
    ├── api-zod/             # Generated Zod validation schemas
    └── db/                  # Drizzle ORM schema (PostgreSQL)
```

## Setup on Replit

1. **Add your Gemini API key** to Replit Secrets as `GEMINI_API_KEY`
2. The app starts automatically via the configured workflows
3. Visit the preview URL to use the chatbot

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | Google Gemini 2.5 Flash (streaming SSE) |
| NLP | Custom TF-IDF + Cosine Similarity |
| API | OpenAPI 3.1 + Orval codegen |
| Java Ref | Spring Boot 3, Java 17 (see java-src/) |

## Java Reference Implementation

The `java-src/` directory contains the equivalent Java implementation for internship evaluation:

- `NlpEngine.java` — Tokenization, stop-word removal, TF-IDF, cosine similarity
- `FaqMatcher.java` — TF-IDF-based FAQ matching with threshold
- `GeminiService.java` — Java HttpClient calling Gemini API with SSE streaming
- `ChatService.java` — Business logic orchestrating NLP + Gemini
- `ChatController.java` — MVC REST controller

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gemini/conversations` | List all conversations |
| POST | `/api/gemini/conversations` | Create new conversation |
| GET | `/api/gemini/conversations/:id` | Get conversation + messages |
| DELETE | `/api/gemini/conversations/:id` | Delete conversation |
| POST | `/api/gemini/conversations/:id/messages` | Send message (SSE stream) |
| POST | `/api/faq/match` | NLP FAQ match |
| GET | `/api/faq/list` | List all FAQs |
