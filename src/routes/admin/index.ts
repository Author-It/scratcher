import { config } from "dotenv";
config();

import { Router, Request, Response } from "express";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");

const router = Router();

router.get("/reset/day/:pass", async (req, res) => {

    const pass = req.params.pass;

    if (pass != process.env.PASSWORD) return res.status(403).send("ERROR")

    let conn;
    try {
        conn = await pool.getConnection();

        await conn.query(`UPDATE admin SET day=day+1 WHERE id=1`);


        res.send("DAILY RESET SUCCESS");
        logger.event("DAILY RESET OCCURED");
    } catch (error) {
        if (error instanceof Error) {
            logger.error("====================================");
            logger.error(error.name);
            logger.error(error.message);
            logger.error("====================================");
        } else {
            logger.error("====================================");
            logger.error("UNEXPECTED ERROR");
            logger.error("====================================");
        }
        res.status(500).send("ERROR FEEDING VALUES INTO DATABASE");
    } finally {
        if (conn) await conn.release();
    }
});

export default router;