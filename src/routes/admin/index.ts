import { config } from "dotenv";
config();

import { Router, Request, Response } from "express";
import { pool } from "../../client/database";
const logger = require("../../utils/logger");

import axios from "axios";
import { getAccessToken, naam } from "../../utils/functions";

const router = Router();

router.get("/reset/day/:pass", async (req, res) => {

    const { pass } = req.params;

    if (pass != process.env.PASSWORD) return res.status(403).send("ERROR");

    let conn;
    try {
        conn = await pool.getConnection();

        getAccessToken().then(function(token){

            axios.post(
                "https://fcm.googleapis.com/v1/projects/scratchcash-da8ee/messages:send", 
                {
                    "message": {
                        "topic": "topic",
                        "notification": {
                            "title": "Daily Reset",
                            "body": "All tasks have been reset start earning again!"
                        },
                        "android": {
                            "notification": {
                                "image": "https://i.imgur.com/I1O0GXc.jpg"
                            }
                        }
                    }
                },
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );
        });

        await conn.query(`UPDATE users SET daily=0,ads20=0 WHERE 1`);
        res.send("DAILY RESET SUCCESS");
        
        logger.event("DAILY RESET OCCURRED");
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

router.get("/testNotif", async (req, res) => {

    try {
        getAccessToken().then(function(token){

            axios.post(
                "https://fcm.googleapis.com/v1/projects/scratchcash-da8ee/messages:send", 
                {
                    "message": {
                        "topic": "topic",
                        "notification": {
                            "title": "Daily Reset",
                            "body": "All tasks have been reset start earning again!"
                        },
                        "android": {
                            "notification": {
                                "image": "https://i.imgur.com/I1O0GXc.jpg"
                            }
                        }
                    }
                },
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            )
        })

        res.send("NOTIF SENT");
        
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
    }
});

router.get("/changeMail/:pass", async (req, res) => {
    const { pass } = req.params;

    if (pass != process.env.ADMIN_PASS)

    try {
        req.app.set("emails", await naam());
        res.send(req.app.get("emails"));
    } catch (e) {
        console.log(e)
        res.status(500).send("INTERNAL SERVER ERROR");
    }
});

export default router;