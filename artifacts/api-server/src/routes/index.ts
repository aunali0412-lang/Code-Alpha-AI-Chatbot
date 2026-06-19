import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import faqRouter from "./faq";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(faqRouter);

export default router;
