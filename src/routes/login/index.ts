import { config } from "dotenv";
config();

import { Router, Request, Response } from "express";
import { decryptRSA } from "../../utils/functions";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");
const router = Router();

interface meow {
    fingerprint: string;
    uid: string;
    deviceID: string;
    time: number;
}

router.post("/", async (req: Request, res: Response) => {
    if (!req.body.encrypted) return res.status(403).send("INVALID REQUEST FORMAT");

    let conn;
    try {
        const encrypted = req.body.encrypted;
        const decrypted = await decryptRSA(encrypted);
        const obj: meow = JSON.parse(decrypted);
        let a = Array.from(Array(8), () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase();

        conn = await pool.getConnection();
        if (obj.fingerprint != process.env.FINGERPRINT) {
            
            conn.query(`UPDATE admin SET fingerprintCount=fingerprintCount+1 WHERE id=1`);
            res.send("INVALID APP FINGERPRINT");
            return;
        }

        logger.success("New Account Created: " + obj.uid);

        conn = await pool.getConnection();
        const findUID = await conn.query(`SELECT * FROM users WHERE uid=?`, [obj.uid]);
        const findDeviceID = await conn.query(`SELECT * FROM users WHERE deviceID=?`, [obj.deviceID]);
        const findRef = await conn.query(`SELECT * FROM users WHERE referral=?`, [a]);

        if (findDeviceID[0]) return res.status(409).send("ACCOUNT ALREADY CREATED FROM THIS DEVICE. LOGIN FROM THAT ACCOUND INSTEAD");
        if (findRef[0]) a = a.replace(a[0], "0");
        if (findUID[0]) return res.status(409).send("ACCOUNT ALREADY EXISTS WITH THIS EMAIL");

        await conn.query(`INSERT INTO users (uid, referral, deviceID, nextWinning) VALUES (?, ?, ?, ?)`, [obj.uid, a, obj.deviceID, Math.floor(Math.random() * (10 - 1 + 1) + 1)]);
        res.status(201).send("Data Creation Success!");
    } catch (error) {
        console.log(error)
        res.status(500).send("ERROR FEEDING VALUES INTO DATABASE");
    } finally {
        if (conn) await conn.release();
    }
})

export default router;