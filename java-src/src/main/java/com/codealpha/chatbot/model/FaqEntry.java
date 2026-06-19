package com.codealpha.chatbot.model;

/**
 * FAQ Entry model — stores a question-answer pair for NLP matching.
 * Used by the TF-IDF FaqMatcher service.
 */
public class FaqEntry {

    private int id;
    private String question;
    private String answer;

    public FaqEntry() {}

    public FaqEntry(int id, String question, String answer) {
        this.id = id;
        this.question = question;
        this.answer = answer;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    @Override
    public String toString() {
        return "FaqEntry{id=" + id + ", question='" + question + "'}";
    }
}
