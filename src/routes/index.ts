import { Router } from "express";
const router = Router();

import loginRoute from "./login/index";


router.use("/login", loginRoute);




router.get("/", async (req, res) => {
    res.send("WELCOME TO OUR API!! 🌏🌏🌏")
})
export default router;