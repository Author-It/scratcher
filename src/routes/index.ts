import { Router } from "express";
const router = Router();

import loginRoute from "./login/index";
import dashRoute from "./dash/index";
import payoutRoute from "./payout/index";
import scratchRoute from "./scratch/index";

router.use("/login", loginRoute);
router.use("/dash", dashRoute);
router.use("/payout", payoutRoute);
router.use("/scratch", scratchRoute);

router.get("/", async (req, res) => {
    res.send("WELCOME TO OUR API!! 🌏🌏🌏")
});

export default router;