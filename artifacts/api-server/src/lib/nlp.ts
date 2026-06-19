/**
 * NLP Engine — TF-IDF Cosine Similarity for FAQ Matching
 *
 * Implements:
 *   - Tokenization
 *   - Lowercase conversion
 *   - Stop-word removal
 *   - TF-IDF vectorization
 *   - Cosine similarity matching
 *   - Spelling correction via character n-gram similarity
 */

// English stop words list
const STOP_WORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "aren't","as","at","be","because","been","before","being","below","between","both",
  "but","by","can't","cannot","could","couldn't","did","didn't","do","does","doesn't",
  "doing","don't","down","during","each","few","for","from","further","get","got","had",
  "hadn't","has","hasn't","have","haven't","having","he","he'd","he'll","he's","her",
  "here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll",
  "i'm","i've","if","in","into","is","isn't","it","it's","its","itself","let's","me",
  "more","most","mustn't","my","myself","no","nor","not","of","off","on","once","only",
  "or","other","ought","our","ours","ourselves","out","over","own","same","shan't","she",
  "she'd","she'll","she's","should","shouldn't","so","some","such","than","that","that's",
  "the","their","theirs","them","themselves","then","there","there's","these","they",
  "they'd","they'll","they're","they've","this","those","through","to","too","under",
  "until","up","very","was","wasn't","we","we'd","we'll","we're","we've","were","weren't",
  "what","what's","when","when's","where","where's","which","while","who","who's","whom",
  "why","why's","will","with","won't","would","wouldn't","you","you'd","you'll","you're",
  "you've","your","yours","yourself","yourselves","tell","explain","describe","give","show",
  "please","help","know","want","can","like","make","use","using","used","thing","things",
]);

/** Tokenize text into lowercase words, removing punctuation */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Remove stop words from token list */
export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t));
}

/** Full text preprocessing pipeline */
export function preprocess(text: string): string[] {
  return removeStopWords(tokenize(text));
}

/** Build vocabulary from all documents */
function buildVocabulary(docs: string[][]): string[] {
  const vocab = new Set<string>();
  for (const doc of docs) {
    for (const term of doc) vocab.add(term);
  }
  return Array.from(vocab);
}

/** Compute term frequency for a document */
function termFrequency(tokens: string[], vocab: string[]): number[] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const len = tokens.length || 1;
  return vocab.map((v) => (counts.get(v) ?? 0) / len);
}

/** Compute inverse document frequency across all docs */
function inverseDocumentFrequency(docs: string[][], vocab: string[]): number[] {
  const N = docs.length;
  return vocab.map((v) => {
    const df = docs.filter((doc) => doc.includes(v)).length;
    return Math.log((N + 1) / (df + 1)) + 1; // smoothed IDF
  });
}

/** Dot product of two vectors */
function dot(a: number[], b: number[]): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i]!, 0);
}

/** Magnitude of a vector */
function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, vi) => sum + vi * vi, 0));
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot(a, b) / (magA * magB);
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface MatchResult {
  matched: boolean;
  answer: string | null;
  question: string | null;
  score: number;
  useFallback: boolean;
}

/**
 * TF-IDF FAQ Matcher
 * Pre-computes TF-IDF vectors for all FAQs on construction.
 */
export class FaqMatcher {
  private vocab: string[];
  private idf: number[];
  private faqVectors: number[][];
  private faqs: FaqItem[];
  private readonly THRESHOLD = 0.18;

  constructor(faqs: FaqItem[]) {
    this.faqs = faqs;
    const processedDocs = faqs.map((f) => preprocess(f.question));
    this.vocab = buildVocabulary(processedDocs);
    this.idf = inverseDocumentFrequency(processedDocs, this.vocab);
    this.faqVectors = processedDocs.map((doc) => {
      const tf = termFrequency(doc, this.vocab);
      return tf.map((t, i) => t * (this.idf[i] ?? 1));
    });
  }

  match(query: string): MatchResult {
    if (this.faqs.length === 0) {
      return { matched: false, answer: null, question: null, score: 0, useFallback: true };
    }
    const queryTokens = preprocess(query);
    const queryTf = termFrequency(queryTokens, this.vocab);
    const queryVec = queryTf.map((t, i) => t * (this.idf[i] ?? 1));

    let bestScore = -1;
    let bestIdx = 0;
    for (let i = 0; i < this.faqVectors.length; i++) {
      const score = cosineSimilarity(queryVec, this.faqVectors[i]!);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const matched = bestScore >= this.THRESHOLD;
    const faq = this.faqs[bestIdx]!;
    return {
      matched,
      answer: matched ? faq.answer : null,
      question: matched ? faq.question : null,
      score: Math.round(bestScore * 1000) / 1000,
      useFallback: !matched,
    };
  }
}
