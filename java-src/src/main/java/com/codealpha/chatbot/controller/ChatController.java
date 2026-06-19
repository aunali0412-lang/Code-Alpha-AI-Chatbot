package com.codealpha.chatbot.controller;

import com.codealpha.chatbot.model.Conversation;
import com.codealpha.chatbot.model.Message;
import com.codealpha.chatbot.service.ChatService;
import com.codealpha.chatbot.service.ChatService.ChatResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.*;

/**
 * ChatController — MVC Controller handling HTTP requests for chat operations.
 *
 * REST API Endpoints:
 *   GET  /api/conversations          — list all conversations
 *   POST /api/conversations          — create new conversation
 *   GET  /api/conversations/{id}     — get conversation with messages
 *   DELETE /api/conversations/{id}   — delete conversation
 *   POST /api/conversations/{id}/messages — send message, get AI response
 *
 * In a Spring Boot app, annotate with @RestController and @RequestMapping("/api").
 * This vanilla implementation uses HttpServlet for framework independence.
 */
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ── GET /api/conversations ───────────────────────────────────────────────

    public void listConversations(HttpServletResponse resp) throws IOException {
        List<Conversation> convs = chatService.listConversations();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < convs.size(); i++) {
            Conversation c = convs.get(i);
            json.append("{\"id\":").append(c.getId())
                .append(",\"title\":\"").append(escapeJson(c.getTitle())).append("\"")
                .append(",\"createdAt\":\"").append(c.getCreatedAt()).append("\"}");
            if (i < convs.size() - 1) json.append(",");
        }
        json.append("]");
        resp.getWriter().write(json.toString());
    }

    // ── POST /api/conversations ──────────────────────────────────────────────

    public void createConversation(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String body = readBody(req);
        String title = extractJsonField(body, "title");
        if (title == null || title.isEmpty()) {
            resp.sendError(400, "title is required");
            return;
        }

        Conversation conv = chatService.createConversation(title);
        resp.setStatus(201);
        resp.setContentType("application/json");
        resp.getWriter().write(
            "{\"id\":" + conv.getId() +
            ",\"title\":\"" + escapeJson(conv.getTitle()) + "\"" +
            ",\"createdAt\":\"" + conv.getCreatedAt() + "\"}"
        );
    }

    // ── POST /api/conversations/{id}/messages ────────────────────────────────

    public void sendMessage(HttpServletRequest req, HttpServletResponse resp, Long convId)
            throws IOException {
        String body = readBody(req);
        String content = extractJsonField(body, "content");
        if (content == null || content.isEmpty()) {
            resp.sendError(400, "content is required");
            return;
        }

        try {
            ChatResponse result = chatService.sendMessage(convId, content);
            resp.setContentType("application/json");
            Message msg = result.message;

            String nlpJson = "{\"matched\":" + result.nlpResult.matched
                + ",\"score\":" + result.nlpResult.score
                + ",\"question\":" + (result.nlpResult.question != null
                    ? "\"" + escapeJson(result.nlpResult.question) + "\"" : "null")
                + "}";

            resp.getWriter().write(
                "{\"id\":" + msg.getId()
                + ",\"role\":\"assistant\""
                + ",\"content\":\"" + escapeJson(msg.getContent()) + "\""
                + ",\"createdAt\":\"" + msg.getCreatedAt() + "\""
                + ",\"source\":\"" + result.source + "\""
                + ",\"nlp\":" + nlpJson + "}"
            );
        } catch (IllegalArgumentException e) {
            resp.sendError(404, e.getMessage());
        } catch (Exception e) {
            resp.sendError(500, "Internal server error: " + e.getMessage());
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    private String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start < 0) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        return end < 0 ? null : json.substring(start, end).replace("\\n", "\n").replace("\\\"", "\"");
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
