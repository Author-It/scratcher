import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { sha1 } from "node-forge"
import { pool } from "../../client/database";
import { decryptRSA } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

interface meow {
    fingerprint: string;
    uid: string;
    time: number;
}

router.put(
    "/tickets_3",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
            const encrypted = req.body.encrypted;
            const decrypted = await decryptRSA(encrypted);
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.status(403).send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            res.locals.uid = obj.uid;

            next();
        } catch (e) {
            console.log(e);
            res.status(500).send("INTERNAL SERVER ERROR");
        }
    },
    async (req: Request, res: Response) => {
        let conn;
        try {
            conn = await pool.getConnection();
            const r = await conn.query(`SELECT ads,ads20,waitingTime FROM users WHERE uid=?`, [res.locals.uid]);

            const aa = parseInt((Date.now() / 1000).toString());
            if (aa < r[0].ads) return res.status(403).send(`YOU MUST WAIT ${r[0].ads - aa} SECONDS MORE!`)

            await conn.query(`UPDATE users SET ticket=ticket+10,ads=?,totalAds=totalAds+1,ads20=ads20+1,waitingTime = waitingTime + ? WHERE uid=?`, [parseInt((Date.now() / 1000).toString()) + r[0].waitingTime, (r[0].ads20 > 50 ? 20 : 0), res.locals.uid]);
            res.send("REWARD CLAIMED!");
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
            if (conn) conn.release();
        }
    }
);

router.get("/tickets_5", async (req: Request, res: Response) => {

    const userID = req.query.user_id;
    const event = req.query.event;
    const eventToken = req.query.token;

    if (!userID || !event || !eventToken) { res.status(422).send("Incomplete data sent"); logger.warn("Incomplete data"); return; }

    const toCheck = sha1.create().update(event! + process.env.APPLOVIN_TOKEN!).digest().toHex().toString()

    if (toCheck != eventToken) {
        res.status(400).send("Bad Request");
        logger.warn("Bad SHA");
        return;
    };

    let conn;
    try {

        conn = await pool.getConnection();
        const r = await conn.query(`SELECT ads FROM users WHERE uid=?`, [userID]);

        const aa = parseInt((Date.now() / 1000).toString());
        if (aa < r[0].ads) return res.status(403).send(`YOU MUST WAIT ${r[0].ads - aa} SECONDS MORE!`);

        await conn.query(`UPDATE users SET ticket=ticket+20,ads2=?,totalAds2=totalAds2+1 WHERE uid=?`, [(Date.now() / 1000) + 3600, userID]);
        res.send("REWARD CLAIMED!");
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
        if (conn) conn.release();
    }
});


router.put(
    "/tickets_10",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
            const encrypted = req.body.encrypted;
            const decrypted = await decryptRSA(encrypted);
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.status(403).send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            res.locals.uid = obj.uid;

            next();
        } catch (e) {
            console.log(e);
            res.status(500).send("INTERNAL SERVER ERROR");
        }
    },
    async (req: Request, res: Response) => {
        let conn;
        try {
            conn = await pool.getConnection();
            const r = await conn.query(`SELECT ads10 FROM users WHERE uid=?`, [res.locals.uid]);

            const aa = parseInt((Date.now() / 1000).toString());
            if (aa < r[0].ads10) return res.status(403).send(`YOU MUST WAIT ${r[0].ads10 - aa} SECONDS MORE!`)

            await conn.query(`UPDATE users SET ads10=?,totalAds10=totalAds10+1, points = points + 50 WHERE uid=?`, [parseInt((Date.now() / 1000).toString()) + 600, res.locals.uid]);
            res.send("REWARD CLAIMED!");
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
            if (conn) conn.release();
        }
    }
);

export default router;