package com.codealpha.chatbot.nlp;

import com.codealpha.chatbot.model.FaqEntry;

import java.util.*;

/**
 * FAQ Matcher — Uses TF-IDF vectorization and cosine similarity to find
 * the most relevant FAQ answer for a user query.
 *
 * Implements the complete NLP pipeline:
 *   tokenization → stop-word removal → TF-IDF → cosine similarity → best match
 */
public class FaqMatcher {

    /** Minimum similarity score to consider a match valid */
    private static final double THRESHOLD = 0.18;

    private final NlpEngine nlp;
    private final List<FaqEntry> faqs;
    private final List<String> vocabulary;
    private final double[] idf;
    private final double[][] faqVectors;

    /**
     * Construct a FaqMatcher and pre-compute TF-IDF vectors for all FAQs.
     *
     * @param faqs list of FAQ entries to train on
     */
    public FaqMatcher(List<FaqEntry> faqs) {
        this.nlp  = new NlpEngine();
        this.faqs = faqs;

        // Preprocess all FAQ questions
        List<List<String>> processedDocs = new ArrayList<>();
        for (FaqEntry faq : faqs) {
            processedDocs.add(nlp.preprocess(faq.getQuestion()));
        }

        // Build vocabulary and IDF
        this.vocabulary  = nlp.buildVocabulary(processedDocs);
        this.idf         = nlp.inverseDocumentFrequency(processedDocs, vocabulary);

        // Pre-compute TF-IDF vectors for all FAQ questions
        this.faqVectors = new double[faqs.size()][];
        for (int i = 0; i < faqs.size(); i++) {
            faqVectors[i] = nlp.tfidfVector(processedDocs.get(i), vocabulary, idf);
        }
    }

    /**
     * Match a user query against all FAQs and return the best result.
     *
     * @param query user's natural language query
     * @return MatchResult with the best FAQ match or fallback indicator
     */
    public MatchResult match(String query) {
        if (faqs.isEmpty()) {
            return new MatchResult(false, null, null, 0.0, true);
        }

        // Preprocess query using the same NLP pipeline
        List<String> queryTokens = nlp.preprocess(query);
        double[] queryVector = nlp.tfidfVector(queryTokens, vocabulary, idf);

        // Find FAQ with highest cosine similarity
        double bestScore = -1.0;
        int bestIdx = 0;
        for (int i = 0; i < faqVectors.length; i++) {
            double score = nlp.cosineSimilarity(queryVector, faqVectors[i]);
            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        boolean matched = bestScore >= THRESHOLD;
        FaqEntry best = faqs.get(bestIdx);

        return new MatchResult(
            matched,
            matched ? best.getAnswer() : null,
            matched ? best.getQuestion() : null,
            Math.round(bestScore * 1000.0) / 1000.0,
            !matched
        );
    }

    /** Result of an FAQ match attempt */
    public static class MatchResult {
        public final boolean matched;
        public final String answer;
        public final String question;
        public final double score;
        public final boolean useFallback;

        public MatchResult(boolean matched, String answer, String question,
                           double score, boolean useFallback) {
            this.matched     = matched;
            this.answer      = answer;
            this.question    = question;
            this.score       = score;
            this.useFallback = useFallback;
        }
    }
}
