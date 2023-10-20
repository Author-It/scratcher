import { Router } from "express";
import { pool } from "../../client/database";

const router = Router();

router.get("/:uid", async (req, res) => {

    const { uid } = req.params;

    let conn;
    try {
        conn = await pool.getConnection();

        const r = await conn.query(`SELECT pointsHistory FROM users WHERE uid=?`, [uid]);

        res.send(JSON.parse(r[0].pointsHistory));
    } catch (error) {
        
    } finally {
        if (conn) await conn.release()
    }
    res.send(":>")
});




export default router;