import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { decryptRSA, addPointsHistory } from "../../utils/functions";
import { md5 } from "node-forge";
const logger = require("../../utils/logger.js");

const router = Router();

router.get("/", async (req, res) => {
    
    const status = req.query.status;
    const trans_id = req.query.trans_id;
    const sub_id = req.query.sub_id;
    const sub_id_2 = req.query.sub_id_2;
    const sub_id_3 = req.query.sub_id_3;
    const sub_id_4 = req.query.sub_id_4;
    const sub_id_5 = req.query.sub_id_5;
    const gross = req.query.gross;
    const amount = req.query.amount;
    const offer_id =  req.query.offer_id;
    const offer_name = req.query.offer_name;
    const category = req.query.category;
    const os = req.query.os;
    const app_id = req.query.app_id;
    const ip_address = req.query.ip_address;
    const signature = req.query.signature;

    const secret_key = process.env.SECRET_KEY;

    if (!amount || !sub_id || signature) {
        res.send("0");
        return;
    }
    
    let conn;
    try {
        const md = md5.create()
        const validation_signature = md.update(sub_id + ":" + amount + ":" + secret_key).digest().toString();

        if (validation_signature != signature) {
            res.send("0");
            return;
        }

        conn = await pool.getConnection();

        await conn.query(``);
        await addPointsHistory("", parseInt(amount!.toString()), "OfferWall Task", "offer_wall")
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
    } finally {
        if (conn) await conn.release();
    }
 
    res.status(200).send("1");
});

export default router;