package com.codealpha.chatbot.service;

import com.codealpha.chatbot.model.Message;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

/**
 * GeminiService — Calls the Google Gemini API to generate AI responses.
 *
 * Uses Java's built-in HttpClient (Java 11+) to send chat messages
 * and receive streaming responses via Server-Sent Events (SSE).
 *
 * API Documentation: https://ai.google.dev/api/generate-content
 */
public class GeminiService {

    private static final String GEMINI_API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

    private final String apiKey;
    private final HttpClient httpClient;

    public GeminiService(String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Generate an AI response for the given conversation history.
     *
     * @param messages conversation history (user + assistant turns)
     * @param systemInstruction optional system prompt
     * @return generated text response
     * @throws IOException on network/API errors
     */
    public String generateResponse(List<Message> messages, String systemInstruction)
            throws IOException, InterruptedException {

        // Build JSON request body
        StringBuilder contents = new StringBuilder("[");
        for (int i = 0; i < messages.size(); i++) {
            Message msg = messages.get(i);
            String role = "assistant".equals(msg.getRole()) ? "model" : "user";
            String escaped = escapeJson(msg.getContent());
            contents.append("{\"role\":\"").append(role)
                    .append("\",\"parts\":[{\"text\":\"").append(escaped).append("\"}]}");
            if (i < messages.size() - 1) contents.append(",");
        }
        contents.append("]");

        String sysEscaped = escapeJson(systemInstruction != null ? systemInstruction : "");
        String requestBody = "{"
            + "\"contents\":" + contents + ","
            + "\"systemInstruction\":{\"parts\":[{\"text\":\"" + sysEscaped + "\"}]},"
            + "\"generationConfig\":{\"maxOutputTokens\":8192}"
            + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + "?key=" + apiKey + "&alt=sse"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(120))
                .build();

        HttpResponse<Stream<String>> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofLines()
        );

        if (response.statusCode() != 200) {
            throw new IOException("Gemini API error: HTTP " + response.statusCode());
        }

        // Parse SSE stream — accumulate all text chunks
        StringBuilder fullResponse = new StringBuilder();
        response.body().forEach(line -> {
            if (line.startsWith("data: ") && !line.equals("data: [DONE]")) {
                String json = line.substring(6);
                // Extract text from: candidates[0].content.parts[0].text
                int textIdx = json.indexOf("\"text\":\"");
                if (textIdx >= 0) {
                    int start = textIdx + 8;
                    int end = json.indexOf("\"", start);
                    while (end > 0 && json.charAt(end - 1) == '\\') {
                        end = json.indexOf("\"", end + 1);
                    }
                    if (end > start) {
                        String chunk = json.substring(start, end)
                                .replace("\\n", "\n")
                                .replace("\\\"", "\"")
                                .replace("\\\\", "\\");
                        fullResponse.append(chunk);
                    }
                }
            }
        });

        return fullResponse.toString().trim();
    }

    /** Simple JSON string escaping */
    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
