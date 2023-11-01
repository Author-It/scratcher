import { Router } from "express";
const router = Router();

import adminRoute from "./admin/index"
import applovinRoute from "./applovin/index";
import dashRoute from "./dash/index";
import giftRoute from "./gift/index";
import loginRoute from "./login/index";
import offerwallRoute from "./offerwall/index";
import payoutRoute from "./payout/index";
import referralRoute from "./referral/index";
import scratchRoute from "./scratch/index";

router.use("/admin", adminRoute);
router.use("/applovin", applovinRoute);
router.use("/dash", dashRoute);
router.use("/gift", giftRoute);
router.use("/login", loginRoute);
router.use("/offerwall", offerwallRoute);
router.use("/payout", payoutRoute);
router.use("/referral", referralRoute);
router.use("/scratch", scratchRoute);

router.get("/", async (req, res) => {
    res.send("WELCOME TO OUR API!! 🌏🌏🌏 - sc");
});

export default router;