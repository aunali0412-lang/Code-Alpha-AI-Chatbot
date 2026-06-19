/**
 * Gemini AI Routes — Conversation management + streaming chat + FAQ-first NLP
 *
 * Architecture:
 *   1. User sends a message
 *   2. NLP engine tries to match against FAQ (TF-IDF cosine similarity)
 *   3. If FAQ match found (score >= threshold): return FAQ answer directly
 *   4. If no match: stream Gemini AI response
 */
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { GoogleGenAI } from "@google/genai";
import { FaqMatcher } from "../../lib/nlp";
import { FAQ_DATA } from "../../lib/faqs";
import {
  CreateGeminiConversationBody,
  SendGeminiMessageBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
} from "@workspace/api-zod";

const router = Router();

// Initialize Gemini client (lazy — API key checked at startup)
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Pre-built FAQ matcher
const faqMatcher = new FaqMatcher(FAQ_DATA);

// ─── Conversations ────────────────────────────────────────────────────────────

/** GET /api/gemini/conversations */
router.get("/gemini/conversations", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(conversations.createdAt);
    res.json(
      rows.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/gemini/conversations */
router.post("/gemini/conversations", async (req, res) => {
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: parsed.data.title })
      .returning();
    res.status(201).json({
      id: conv!.id,
      title: conv!.title,
      createdAt: conv!.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/gemini/conversations/:id */
router.get("/gemini/conversations/:id", async (req, res) => {
  const params = GetGeminiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.data.id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);
    res.json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

/** DELETE /api/gemini/conversations/:id */
router.delete("/gemini/conversations/:id", async (req, res) => {
  const params = DeleteGeminiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const deleted = await db
      .delete(conversations)
      .where(eq(conversations.id, params.data.id))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

/** GET /api/gemini/conversations/:id/messages */
router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const params = ListGeminiMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);
    res.json(
      msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/gemini/conversations/:id/messages
 *
 * Flow:
 *   1. Save user message to DB
 *   2. Try FAQ NLP match
 *   3a. FAQ hit → stream the FAQ answer as SSE
 *   3b. No hit → stream Gemini AI response as SSE
 *   4. Save assistant message to DB
 */
router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const params = SendGeminiMessageParams.safeParse({ id: Number(req.params.id) });
  const body = SendGeminiMessageBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const convId = params.data.id;
  const userContent = body.data.content;

  // Verify conversation exists
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, convId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content: userContent,
  });

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // ── Step 2: FAQ NLP matching ──────────────────────────────────────────
  const faqResult = faqMatcher.match(userContent);

  // Send NLP metadata event so client can show "Matched FAQ" badge
  res.write(`data: ${JSON.stringify({ nlp: { matched: faqResult.matched, score: faqResult.score, question: faqResult.question } })}\n\n`);

  let fullResponse = "";

  if (faqResult.matched && faqResult.answer) {
    // ── Step 3a: FAQ answer — stream it word by word for typing effect ──
    const words = faqResult.answer.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      // small delay for typing effect
      await new Promise((r) => setTimeout(r, 18));
    }
  } else {
    // ── Step 3b: Gemini AI fallback ───────────────────────────────────
    if (!ai) {
      const errMsg = "Gemini AI is not configured. Please add GEMINI_API_KEY to Replit Secrets.";
      fullResponse = errMsg;
      res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
    } else {
      // Load conversation history for context
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(messages.createdAt);

      const chatMessages = history.map((m) => ({
        role: m.role === "assistant" ? "model" : ("user" as "model" | "user"),
        parts: [{ text: m.content }],
      }));

      // System instruction for the chatbot persona
      const systemInstruction = `You are an intelligent AI assistant for the CodeAlpha internship project. 
You are helpful, professional, and knowledgeable. You can answer questions about AI, programming, 
machine learning, NLP, and general topics. Be concise but thorough. Format code with backticks.`;

      try {
        const stream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: chatMessages,
          config: {
            maxOutputTokens: 8192,
            systemInstruction,
          },
        });

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      } catch (err) {
        req.log.error({ err }, "Gemini API error");
        const errMsg = "I encountered an error contacting the AI service. Please check your API key and try again.";
        fullResponse = errMsg;
        res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
      }
    }
  }

  // Save assistant message
  if (fullResponse) {
    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse.trim(),
    });
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
