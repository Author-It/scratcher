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
        const get = await conn.query(`SELECT points,ticket,gift,referral,referredBy,totalReferrals,ban,nextWinning,daily,payoutLock,ads,ads2,ads10 FROM users WHERE uid=?;`, [uid]);

        if (!get[0]) return res.status(400).send("INVALID UID")
        await conn.query(`UPDATE users SET requests=requests+1,lastRequest=? WHERE uid=?`, [Date.now(), uid]);
        const emailAddresses = req.app.get("emails");
        
        Object.assign(get[0], {email: emailAddresses});

        res.json(get[0]);
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

            await conn.query(`UPDATE users SET points=points+700,daily=1 WHERE uid=?`, [res.locals.uid]);
            res.send("700 POINTS CLAIMED!");

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

router.put(
    "/claimdaily2",
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

            const user = await conn.query(`SELECT daily,daily2 FROM users WHERE uid=?`, [res.locals.uid]);

            if (!user[0]) return res.status(409).send("BAD REQUEST");
            if (user[0].daily === 1 || user[0].daily2 === 1) return res.status(403).send("DAILY REWARD ALREADY CLAIMED");

            await conn.query(`UPDATE users SET points=points+200,daily2=1 WHERE uid=?`, [res.locals.uid]);
            res.send("PLEASE INSTALL THE APP AND USE IT FOR 30 SECONDS!");

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

router.get("/delete", async (req, res) => {
    res.send("<p style=\"font-size: 1rem;\">To get your account deleted mail us at <b style=\"color: blue\">teamapp.company@gmail.com</b></p><br><br>Or <a href=\"mailto:teamapp.company@gmail.com?subject=Account deletion request\">Click Here</a>");
})

export default router;