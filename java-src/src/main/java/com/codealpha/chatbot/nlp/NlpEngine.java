package com.codealpha.chatbot.nlp;

import java.util.*;
import java.util.stream.Collectors;

/**
 * NLP Engine — Implements core Natural Language Processing techniques:
 *
 *   1. Tokenization        — splits text into word tokens
 *   2. Lowercase conversion — normalizes text to lowercase
 *   3. Stop-word removal   — filters common non-informative words
 *   4. TF-IDF vectorization — weights terms by importance
 *   5. Cosine similarity   — measures vector similarity between query and FAQs
 *
 * Used for intent detection and FAQ matching in the CodeAlpha AI Chatbot.
 */
public class NlpEngine {

    /** English stop words to remove during preprocessing */
    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "a","about","above","after","again","against","all","am","an","and","any",
        "are","as","at","be","because","been","before","being","below","between",
        "both","but","by","can","cannot","could","did","do","does","doing","don",
        "down","during","each","few","for","from","further","get","got","had","has",
        "have","having","he","her","here","hers","herself","him","himself","his",
        "how","i","if","in","into","is","it","its","itself","let","me","more",
        "most","my","myself","no","nor","not","of","off","on","once","only","or",
        "other","ought","our","ours","ourselves","out","over","own","same","she",
        "should","so","some","such","than","that","the","their","theirs","them",
        "themselves","then","there","these","they","this","those","through","to",
        "too","under","until","up","very","was","we","were","what","when","where",
        "which","while","who","whom","why","will","with","you","your","yours",
        "yourself","yourselves","tell","explain","describe","give","show","please",
        "help","know","want","like","make","use","using","used","thing","things"
    ));

    /**
     * STEP 1 & 2: Tokenize text and convert to lowercase.
     * Splits on non-alphanumeric characters, removes punctuation.
     *
     * @param text raw input string
     * @return list of lowercase tokens
     */
    public List<String> tokenize(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        // Lowercase and remove non-alphanumeric characters (keep spaces)
        String normalized = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");

        // Split on whitespace and filter empty tokens
        return Arrays.stream(normalized.split("\\s+"))
                .filter(t -> t.length() > 1)
                .collect(Collectors.toList());
    }

    /**
     * STEP 3: Remove stop words from token list.
     *
     * @param tokens list of tokens
     * @return filtered list without stop words
     */
    public List<String> removeStopWords(List<String> tokens) {
        return tokens.stream()
                .filter(t -> !STOP_WORDS.contains(t))
                .collect(Collectors.toList());
    }

    /**
     * Full preprocessing pipeline: tokenize → lowercase → remove stop words.
     *
     * @param text raw input
     * @return processed token list
     */
    public List<String> preprocess(String text) {
        return removeStopWords(tokenize(text));
    }

    /**
     * Build vocabulary from a collection of documents.
     *
     * @param documents list of preprocessed token lists
     * @return ordered vocabulary list
     */
    public List<String> buildVocabulary(List<List<String>> documents) {
        Set<String> vocab = new LinkedHashSet<>();
        for (List<String> doc : documents) {
            vocab.addAll(doc);
        }
        return new ArrayList<>(vocab);
    }

    /**
     * STEP 4a: Compute Term Frequency for a document.
     * TF(t, d) = count(t in d) / |d|
     *
     * @param tokens document tokens
     * @param vocab  vocabulary
     * @return TF vector
     */
    public double[] termFrequency(List<String> tokens, List<String> vocab) {
        Map<String, Long> counts = new HashMap<>();
        for (String t : tokens) {
            counts.merge(t, 1L, Long::sum);
        }

        double[] tf = new double[vocab.size()];
        int len = Math.max(tokens.size(), 1);
        for (int i = 0; i < vocab.size(); i++) {
            tf[i] = counts.getOrDefault(vocab.get(i), 0L) / (double) len;
        }
        return tf;
    }

    /**
     * STEP 4b: Compute Inverse Document Frequency (smoothed).
     * IDF(t) = log((N+1) / (df(t)+1)) + 1
     *
     * @param documents list of preprocessed token lists
     * @param vocab     vocabulary
     * @return IDF vector
     */
    public double[] inverseDocumentFrequency(List<List<String>> documents, List<String> vocab) {
        int N = documents.size();
        double[] idf = new double[vocab.size()];

        for (int i = 0; i < vocab.size(); i++) {
            final String term = vocab.get(i);
            long df = documents.stream().filter(doc -> doc.contains(term)).count();
            idf[i] = Math.log((N + 1.0) / (df + 1.0)) + 1.0; // smoothed
        }
        return idf;
    }

    /**
     * Compute TF-IDF vector for a document.
     *
     * @param tokens document tokens
     * @param vocab  vocabulary
     * @param idf    IDF vector
     * @return TF-IDF vector
     */
    public double[] tfidfVector(List<String> tokens, List<String> vocab, double[] idf) {
        double[] tf = termFrequency(tokens, vocab);
        double[] tfidf = new double[vocab.size()];
        for (int i = 0; i < tfidf.length; i++) {
            tfidf[i] = tf[i] * idf[i];
        }
        return tfidf;
    }

    /**
     * STEP 5: Cosine similarity between two vectors.
     * cos(θ) = (A · B) / (|A| × |B|)
     *
     * @param a first vector
     * @param b second vector
     * @return similarity score in [0, 1]
     */
    public double cosineSimilarity(double[] a, double[] b) {
        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.length; i++) {
            dot  += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        if (magA == 0 || magB == 0) return 0.0;
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }
}
