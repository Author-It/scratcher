import { config } from "dotenv";
config();

import { Router } from "express";
import { pool } from "../../client/database";
import { addPointsHistory } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

router.get("/", async (req, res) => {
    console.log("ai")
    if (!req.query.amount || !req.query.uid || !req.query.pass) return res.send("INVALID REQUEST FORMAT");

    const amount = req.query.amount.toString();
    const uid = req.query.uid.toString();
    const pass = req.query.pass.toString();
    
    if (pass != process.env.ADMIN_PASS) return res.status(401).send("DENIED");
    
    let conn;
    try {

        conn = await pool.getConnection();
        await conn.query(`UPDATE users SET points=points+?,offerwall=offerwall+? WHERE uid=?`, [parseInt(amount), parseInt(amount), uid]);
        await addPointsHistory(uid, parseInt(amount), "OfferWall Task", "offer_wall");

        res.send("SUCCESS");
    } catch (error) {
        console.log(error)
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
    } finally {
        if (conn) await conn.release();
    }
});

export default router;