import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionRouter from "./session";
import assessmentRouter from "./assessment";
import enrollmentRouter from "./enrollment";
import portalRouter from "./portal";
import chatRouter from "./chat";
import accountRouter from "./account";
import coachingRouter from "./coaching";
import billingRouter from "./billing";
import emailRouter from "./email";
import trainerRouter from "./trainer";
import adminRouter from "./admin";
import companyRouter from "./company";
import miscRouter from "./misc";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionRouter);
router.use(assessmentRouter);
router.use(enrollmentRouter);
router.use(portalRouter);
router.use(chatRouter);
router.use(accountRouter);
router.use(coachingRouter);
router.use(billingRouter);
router.use(emailRouter);
router.use(trainerRouter);
router.use(adminRouter);
router.use(companyRouter);
router.use(miscRouter);

export default router;
