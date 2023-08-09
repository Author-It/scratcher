import { config } from "dotenv";
config();

import { Router, Request, Response } from "express";
import { decryptRSA } from "../../utils/functions";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");
const router = Router();

router.get("/getinfo/:uid", async (req:Request, res:Response) => {

        const uid = req.params.uid;

        let conn;
        try {
            conn = await pool.getConnection();
            const get = await conn.query(`SELECT * FROM users WHERE uid=?;`, [uid]);

            if (!get[0]) return res.send("INVALID UID")
            // Object.assign(get[0]);

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
            if (conn) await conn.release();
        }
    }
);

router.get("/", async (req, res) => {
    res.send("hmmmmmmmm");
});

export default router;