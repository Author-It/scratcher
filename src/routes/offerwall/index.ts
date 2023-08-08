import { config } from "dotenv";
config();

import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../../client/database";
import { decryptRSA, addPointsHistory } from "../../utils/functions";
const logger = require("../../utils/logger.js");

const router = Router();

router.get("/", async (req, res) => {
    
    // const status = req.query.status;
    // const trans_id = req.query.trans_id;
    // const sub_id = req.query.sub_id;
    // const sub_id_2 = req.query.sub_id_2;
    // const sub_id_3 = req.query.sub_id_3;
    // const sub_id_4 = req.query.sub_id_4;
    // const sub_id_5 = req.query.sub_id_5;
    // const gross = req.query.gross;
    // const amount = req.query.amount;
    // const offer_id =  req.query.offer_id;
    // const offer_name = req.query.offer_name;
    // const category = req.query.category;
    // const os = req.query.os;
    // const app_id = req.query.app_id;
    // const ip_address = req.query.ip_address;
    // const signature = req.query.signature;

    const secret_key = process.env.SECRET_KEY;
    res.status(200).send("1");
});

export default router;