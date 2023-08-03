import { config } from "dotenv";
config();

import { Router, Request, Response } from "express";
import { decryptRSA } from "../../utils/functions";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");
const router = Router();

router.get(
    "/getinfo",
    async (req:Request, res:Response) => {

        let conn;
        try {
            conn = await pool.getConnection();
            const get = await conn.query(`SELECT * FROM users;`);

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
                logger.error("UNEDPECTED ERROR");
                logger.error("====================================");
            }
        } finally {
            if (conn) conn.release();
        }
    }
);

export default router;