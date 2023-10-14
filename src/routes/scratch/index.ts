import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { addPointsHistory, decryptRSA, getNextAmt } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

interface meow {
    fingerprint: string;
    uid: string;
    time: number;
}

router.put(
    "/claim",
    async (req: Request, res: Response, next: NextFunction) => {

        if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
        const encrypted = req.body.encrypted;
        const decrypted = await decryptRSA(encrypted);

        try {
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            res.locals.uid = obj.uid;

            next();
        } catch (err) {
            console.log(err);
            res.status(409).send(":)");
        }
    },
    async (req: Request, res:Response) => {
        
        let conn;
        try {
            conn = await pool.getConnection()

            const get = await conn.query(`SELECT * FROM users WHERE uid=?`, [res.locals.uid]);
            if (!get[0]) return res.status(403).send("INVALID UID");

            if (get[0].tickets < 0) return res.status(403).send("NOT ENOUGH TICKETS TO OBTAIN A SCRATCH CARD");

            const nw = get[0].nextWinning
            await conn.query(`UPDATE users SET points=points+?,tickets=tickets-1,nextWinning=? WHERE uid=?`, [get[0].nextWinning, res.locals.uid, getNextAmt()]);

            const get2 = await conn.query(`SELECT * FROM users WHERE uid=?`, [res.locals.uid]);

            res.send({msg: `CONGRATULATIONS YOU WON ${nw} POINTS!`, data: get2[0]});
            addPointsHistory(res.locals.uid, get[0].nextWinning, "scratch", "Scratch");
            
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

router.get("/getnext:uid", async (req:Request, res:Response) => {
    const uid = req.params.uid

    let conn;
    try {
        conn = await pool.getConnection();

        const get = await conn.query(`SELECT nextWinning FROM users WHERE uid=?`, [uid]);
        if (!get[0]) res.status(403).send("INVALID UID");

        res.send(get[0].nextWinning);
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