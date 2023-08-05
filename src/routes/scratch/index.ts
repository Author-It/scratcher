import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
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
    "/claim",
    async (req: Request, res: Response, next: NextFunction) => {

        if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");
        const encrypted = req.body.encrypted;
        const decrypted = await decryptRSA(encrypted);

        try {
            const obj: meow = JSON.parse(decrypted);

            if (obj.fingerprint != process.env.FINGERPRINT) return res.send("INVALID APP FINGERPRINT");
            if (obj.time + 5 > Date.now()) return res.status(409).send("REQUEST TIMED OUT");

            res.locals.uid = obj.uid

            next()
        } catch (err) {
            console.log(err)
            res.status(409).send(":)")
        }
    },
    async (req: Request, res:Response) => {
        
        let conn;
        try {
            conn = await pool.getConnection()

            const get = await conn.query(`SELECT * FROM users WHERE uid=?`, [res.locals.uid]);
            
            if (get[0].tickets < 0) return res.status(403).send("NOT ENOUGH TICKETS TO OBTAIN A SCRATCH CARD");

            

        } catch (error) {
            
        }
    }
)


export default router;