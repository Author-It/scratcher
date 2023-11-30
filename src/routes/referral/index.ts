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

router.post(
    "/claim/:refID",
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
    async (req: Request, res: Response) => {
        const ref = req.params.refID;

        let conn;
        try {
            conn = await pool.getConnection();

            if (ref === "TUBEPAY100") {
                const user = await conn.query(`SELECT referral FROM users WHERE uid=?`, [res.locals.uid]);
                
                if (user[0].referral) return res.status(403).send("REFERRAL CODE ALREADY APPLIED");
                await conn.query(`UPDATE users SET points=points+1000,ticket=ticket+5,referredBy=? WHERE uid=?`, ["TUBEPAY" ,res.locals.uid]);
                await conn.query("UPDATE admin SET TP=TP+1 WHERE id=1");
                
                return res.status(201).send("REFERRAL CODE APPLIED SUCCESSFULLY!");
            }

            //jo add kr rha h
            const user = await conn.query(`SELECT referral,referredBy FROM users WHERE uid=?`, [res.locals.uid]);
            
            //jiska add ho rha h
            const check = await conn.query(`SELECT * FROM users WHERE referral=?`, [ref]);

            if (user[0].referredBy) return res.status(403).send("REFERRAL CODE ALREADY APPLIED");
            if (!check[0]) return res.status(409).send("INVALID REFERRAL CODE");
            if (user[0].referral === ref) return res.status(403).send("YOU CANNOT REFER YOURSELF");

            await conn.query(`UPDATE users SET points=points+700,totalReferrals=totalReferrals+1,ticket=ticket+5 WHERE referral=?`, [ref]);
            await conn.query(`UPDATE users SET referredBy=?,points=points+1000,ticket=ticket+5 WHERE uid=?`, [check[0].uid, res.locals.uid]);
            
            res.status(201).send("REFERRAL CODE APPLIED SUCCESSFULLY!");
            logger.info(`${ref} REFERRED ${user[0].referral}`);
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