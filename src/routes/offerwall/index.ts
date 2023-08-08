import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { decryptRSA, addPointsHistory } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

router.get("/", async (req, res) => {
    
    console.log("AYAYAYAYAYAYA")
    res.send("SOON™");
});

export default router;