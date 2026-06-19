package com.codealpha.chatbot.model;

import java.time.LocalDateTime;

/**
 * Message model representing a single chat message.
 * Part of CodeAlpha AI Chatbot — MVC Architecture.
 */
public class Message {

    private Long id;
    private Long conversationId;
    private String role; // "user" or "assistant"
    private String content;
    private LocalDateTime createdAt;

    public Message() {
        this.createdAt = LocalDateTime.now();
    }

    public Message(Long conversationId, String role, String content) {
        this.conversationId = conversationId;
        this.role = role;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "Message{id=" + id + ", role='" + role + "', content='" +
               content.substring(0, Math.min(50, content.length())) + "...'}";
    }
}
