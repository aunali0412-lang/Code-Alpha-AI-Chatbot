package com.codealpha.chatbot.service;

import com.codealpha.chatbot.model.Conversation;
import com.codealpha.chatbot.model.FaqEntry;
import com.codealpha.chatbot.model.Message;
import com.codealpha.chatbot.nlp.FaqMatcher;
import com.codealpha.chatbot.nlp.FaqMatcher.MatchResult;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ChatService — Core business logic for the AI Chatbot.
 *
 * Orchestrates:
 *   1. Conversation management (create, retrieve, delete)
 *   2. NLP-based FAQ matching (TF-IDF cosine similarity)
 *   3. Gemini AI fallback for unmatched queries
 *   4. Message persistence (in-memory for demo; replace with DB in production)
 */
public class ChatService {

    private static final String SYSTEM_INSTRUCTION =
        "You are an intelligent AI assistant for the CodeAlpha internship project. " +
        "You are helpful, professional, and knowledgeable about AI, programming, " +
        "machine learning, NLP, and general topics. Be concise but thorough. " +
        "Format code with backticks when relevant.";

    private final GeminiService geminiService;
    private final FaqMatcher faqMatcher;

    // In-memory storage (replace with JPA/Hibernate for production)
    private final Map<Long, Conversation> conversations = new ConcurrentHashMap<>();
    private final AtomicLong convIdCounter = new AtomicLong(1);
    private final AtomicLong msgIdCounter  = new AtomicLong(1);

    public ChatService(String geminiApiKey, List<FaqEntry> faqs) {
        this.geminiService = new GeminiService(geminiApiKey);
        this.faqMatcher    = new FaqMatcher(faqs);
    }

    // ── Conversation CRUD ────────────────────────────────────────────────────

    public Conversation createConversation(String title) {
        Conversation conv = new Conversation(title);
        conv.setId(convIdCounter.getAndIncrement());
        conversations.put(conv.getId(), conv);
        return conv;
    }

    public List<Conversation> listConversations() {
        return new ArrayList<>(conversations.values());
    }

    public Optional<Conversation> getConversation(Long id) {
        return Optional.ofNullable(conversations.get(id));
    }

    public boolean deleteConversation(Long id) {
        return conversations.remove(id) != null;
    }

    // ── Message handling ─────────────────────────────────────────────────────

    /**
     * Process a user message:
     *   1. Try FAQ NLP match
     *   2. If match found — return FAQ answer
     *   3. If no match — call Gemini AI
     *
     * @param convId  conversation ID
     * @param content user message text
     * @return ChatResponse with AI answer and NLP metadata
     */
    public ChatResponse sendMessage(Long convId, String content)
            throws IOException, InterruptedException {

        Conversation conv = conversations.get(convId);
        if (conv == null) throw new IllegalArgumentException("Conversation not found: " + convId);

        // Save user message
        Message userMsg = new Message(convId, "user", content);
        userMsg.setId(msgIdCounter.getAndIncrement());
        conv.addMessage(userMsg);

        // Step 1: NLP FAQ matching
        MatchResult match = faqMatcher.match(content);

        String responseText;
        String source;

        if (match.matched) {
            // Step 2: Return FAQ answer
            responseText = match.answer;
            source = "faq";
        } else {
            // Step 3: Fallback to Gemini AI
            responseText = geminiService.generateResponse(conv.getMessages(), SYSTEM_INSTRUCTION);
            source = "gemini";
        }

        // Save assistant message
        Message assistantMsg = new Message(convId, "assistant", responseText);
        assistantMsg.setId(msgIdCounter.getAndIncrement());
        conv.addMessage(assistantMsg);

        return new ChatResponse(assistantMsg, match, source);
    }

    // ── Response DTO ─────────────────────────────────────────────────────────

    public static class ChatResponse {
        public final Message message;
        public final MatchResult nlpResult;
        public final String source; // "faq" or "gemini"

        public ChatResponse(Message message, MatchResult nlpResult, String source) {
            this.message   = message;
            this.nlpResult = nlpResult;
            this.source    = source;
        }
    }
}
