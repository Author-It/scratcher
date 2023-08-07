import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { sha1 } from "node-forge"
import { pool } from "../../client/database";
import { addPointsHistory } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

router.get("/tickets", async (req, res) => {
    const userID = req.query.user_id;
    const event = req.query.event;
    const eventToekn = req.query.token;
    if (!userID || !event || !eventToekn) { res.status(422).send("Incomplete data sent"); logger.warn("Incomplete data"); return; }

    const toCheck = sha1.create().update(event! + process.env.APPLOVIN_TOKEN!).digest().toHex().toString()

    if (toCheck != eventToekn) { 
        res.status(400).send("Bad Request"); 
        logger.warn("Bad SHA"); 
        return; 
    };

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`UPDATE users SET tickets=tickets+1 WHERE uid=?`, [userID]).then(v => (res.send("REWARD CLAIMED!")));
    } catch (error) {
        if (error instanceof Error) {
            logger.error("====================================");
            logger.error(error.name);
            logger.error(error.message);
            logger.error("====================================");
        } else {
            logger.error("====================================");
            logger.error("UNEDPECTED ERROR");
            logger.error("====================================");
        }
        res.status(500).send("ERROR FEEDING VALUES INTO DATABASE");
    } finally {
        if (conn) await conn.release();
    }
});

export default router;