package com.codealpha.chatbot.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Conversation model — groups messages into a named chat session.
 * Part of CodeAlpha AI Chatbot — MVC Architecture.
 */
public class Conversation {

    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private List<Message> messages;

    public Conversation() {
        this.createdAt = LocalDateTime.now();
        this.messages = new ArrayList<>();
    }

    public Conversation(String title) {
        this.title = title;
        this.createdAt = LocalDateTime.now();
        this.messages = new ArrayList<>();
    }

    public void addMessage(Message message) {
        this.messages.add(message);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Message> getMessages() { return messages; }
    public void setMessages(List<Message> messages) { this.messages = messages; }
}
