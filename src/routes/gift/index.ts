import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { decryptRSA } from "../../utils/functions";
const logger = require("../../utils/logger");

const router = Router();

interface meow {
    fingerprint: string;
    uid: string;
    time: number;
}

router.put("/claim",

    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
            const encrypted = req.body.encrypted;
            const decrypted = await decryptRSA(encrypted);
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            res.locals.uid = obj.uid;

            next();
        } catch (e) {
            console.log(e);
            res.status(500).send("INTERNAL SERVER ERROR");
        }
    },
    async (req, res) => {

        const { uid } = res.locals;

        let conn;
        try {
            conn = await pool.getConnection();

            const user = await conn.query(`SELECT gift FROM users WHERE uid=?`, [uid]);
            const admin = await conn.query(`SELECT rewards FROM admin WHERE id=1`);

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

    }
);

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