import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import faqRouter from "./faq";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(faqRouter);
router.use(downloadRouter);

export default router;
