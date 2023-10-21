import { Router } from "express";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");

const router = Router();

router.get("/claim", async (req, res) => {

    const { amount, uid } = req.query;
    
    let conn;
    try {
        conn = await pool.getConnection();

        const user = await conn.query(`SELECT gift FROM users WHERE uid=?`, [uid]);
        const admin = await conn.query(`SELECT reward FROM admin WHERE id=1`);

        if (!user[0]) return res.status(400).send("INVALID UID");
        if (user[0].gift) return res.status(400).send("ALREADY CLAIMED");

        await conn.query(`UPDATE users SET points=points+?,gift=1 WHERE uid=?`, [admin[0].rewards, uid]);

        res.send("REWARD CLAIMED SUCCESSFULLY");

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

router.get("/admin", async (req, res) => {
    const { amount, pass } = req.query;

    if (pass !== process.env.ADMIN_PASS) return res.status(400).send("INVALID PASSWORD");

    let conn;
    try {
        conn = await pool.getConnection();

        const admin = await conn.query(`SELECT reward FROM admin WHERE id=1`);
        if (!admin[0]) return res.status(400).send("INVALID UID");

        await conn.query(`UPDATE admin SET reward=? WHERE id=1`, [amount]);

        res.send("REWARD UPDATED SUCCESSFULLY");
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