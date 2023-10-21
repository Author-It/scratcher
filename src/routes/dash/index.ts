import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { decryptRSA } from "../../utils/functions";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");
const router = Router();

interface meow {
    fingerprint: string;
    uid: string;
    time: number;
}

/*
deviceID
offerwall
scratch
lucky
totalAds
totalAds2
*/

router.get("/getinfo/:uid", async (req: Request, res: Response) => {

    const { uid } = req.params;

    let conn;
    try {
        conn = await pool.getConnection();
        const get = await conn.query(`SELECT points,ticket,gift,referral,referredBy,totalReferrals,ban,nextWinning,daily,payoutLock,ads,ads2 FROM users WHERE uid=?;`, [uid]);

        if (!get[0]) return res.status(400).send("INVALID UID")

        const emailAddresses = req.app.get("emails");
        
        Object.assign(get[0], {email: emailAddresses});

        res.json(get[0]);

        console.log(req.socket.bytesRead);
        console.log(req.socket.bytesWritten);
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

router.put(
    "/claimdaily",
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

            const user = await conn.query(`SELECT daily FROM users WHERE uid=?`, [res.locals.uid]);

            if (!user[0]) return res.status(409).send("BAD REQUEST");
            if (user[0].daily === 1) return res.status(403).send("DAILY REWARD ALREADY CLAIMED");

            await conn.query(`UPDATE users SET points=points+200,daily=1 WHERE uid=?`, [res.locals.uid]);
            res.send("DAILY REWARD CLAIMED SUCCESSFULLY!");

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

export default router;