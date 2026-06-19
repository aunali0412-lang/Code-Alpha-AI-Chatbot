/**
 * FAQ Routes — NLP-powered FAQ matching using TF-IDF cosine similarity
 */
import { Router } from "express";
import { FaqMatcher } from "../../lib/nlp";
import { FAQ_DATA } from "../../lib/faqs";
import { MatchFaqBody } from "@workspace/api-zod";

const router = Router();

// Pre-instantiate matcher (builds TF-IDF vectors at startup)
const matcher = new FaqMatcher(FAQ_DATA);

/** POST /api/faq/match — Match a query against FAQ dataset */
router.post("/faq/match", (req, res) => {
  const parsed = MatchFaqBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const result = matcher.match(parsed.data.query);
  res.json(result);
});

/** GET /api/faq/list — Return all FAQs */
router.get("/faq/list", (_req, res) => {
  res.json(FAQ_DATA);
});

export default router;
