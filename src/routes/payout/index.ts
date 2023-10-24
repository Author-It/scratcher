import { config } from "dotenv";
config();

import { unix } from "moment";
import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { decryptRSA, naam } from "../../utils/functions";
const logger = require("../../utils/logger.js");
 
const router = Router();

interface meow {
    uid: string;
    fingerprint: string;
    email: string;
    method: string;
    amount: string;
    time: number; // epoch time
    country: string;
    points: number;
}

const mainObj : { [key: string]: number }= {
    "90000" : 1,
    "7000" : 0.07,
    "20000" : 0.2,
    "490000" : 5,
    "50000" : 0.5,
}

router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction) => {

        if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
        const encrypted = req.body.encrypted;
        const decrypted = await decryptRSA(encrypted);

        try {
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            if (obj.country === "BR" && obj.points === 7000 && obj.method === "Paypal") return res.status(403).send("$0.07 IS NOT AVAILABLE IN PAYPAL. PLEASE CHOOSE A HIGHER AMOUNT.");
            
            res.locals.uid = obj.uid;
            res.locals.method = obj.method;
            res.locals.amount = obj.amount;
            res.locals.email = obj.email;
            res.locals.country = obj.country;
            res.locals.time = obj.time;
            res.locals.points = obj.points;
            
            next();
        } catch (err) {
            console.log(err)
            res.status(409).send(":)")
        }
    },
    async (req, res) => {

        let conn;
        try {
            conn = await pool.getConnection();

            const check = await conn.query("SELECT points,payoutLock FROM users WHERE uid=?", [res.locals.uid]);
            if (check[0].points < res.locals.points) return res.status(403).send("POINTS LESS THAN REQUIRED");

            await conn.query(`INSERT INTO payout (method, amount, email, country, uid, date) VALUES (?,?,?,?,?,?);`, [res.locals.method, res.locals.amount, res.locals.email, res.locals.country, res.locals.uid, unix(res.locals.time).format("DD-MM-YY")]);
            await conn.query(`UPDATE users SET points=points-?,payoutLock=1 WHERE uid=?`, [res.locals.points, res.locals.uid]);
            await conn.query(`UPDATE admin SET totalPayout=totalPayout+? WHERE 1`, [mainObj[String(res.locals.points)]]);
            
            logger.success(`Payout requested by ${res.locals.uid}`);
            res.status(201).send("PAYOUT SUCCESSFULLY REQUESTED.");
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