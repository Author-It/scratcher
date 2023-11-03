import { Router } from "express";
import { pool } from "../../client/database";
const router = Router();

const html = `
<form action="/api/verify" method="POST">
    <input type="text" name="myInput">
    <button type="submit">Submit</button>
</form>
`;

router.get("/", async (req, res) => {

    res.send(html);
});

router.post('/', async (req, res) => {
    // Get the value of the input field
    const inputValue = req.body.myInput;

    let bool: boolean = true;

    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT uid FROM users WHERE referral=?', [inputValue]);

        if (rows.length == 0) {
            bool = false;
        } else {
            bool = true;
            await conn.query('UPDATE users SET referral=? WHERE uid=?', [null, rows[0].uid]);
        }

    } catch (error) {
        console.log(error);
    } finally {
        if (conn) conn.release();
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.


    // Send a response to the client
    if (bool) {
        res.send(`Valid referral code! <br /> <button type="button" onclick="location.reload()">Reload Page</button>`);
    } else {
        res.send(`Invalid referral code! <br /> <button type="button" onclick="location.reload()">Reload Page</button>`);
    }
});

export default router;