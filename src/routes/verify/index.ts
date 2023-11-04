import { Router } from "express";
import { pool } from "../../client/database";
const router = Router();

const html = `
<form action="/api/verify" method="POST">
    <input type="text" name="myInput">
    <button type="submit" placeholder="referral code">Submit</button>
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
        const rows = await conn.query('SELECT hack FROM users WHERE referral=?', [inputValue]);

        if (rows.length == 0) {
            bool = false;
        } else {
            bool = true;
        }

        const html2 = `
            <form action"/api/verify/check?ref=${inputValue}" method="POST">
            <button type="submit" placeholder="cont">Continue</button>
            </form>
        `;

        // Send a response to the client
        if (bool) {
            res.send("VALID REFERRAL CODE" + html2);
        } else {
            res.send(html + "INVALID REFERRAL CODE");
        }

        // res.send(html)

    } catch (error) {
        console.log(error);
    } finally {
        if (conn) conn.release();
    }

    router.post("/check", async (req, res) => {

        const ref = req.query.ref;

        if (!ref) return res.send("???????????????????????????");

        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT hack FROM users WHERE referral=?', [ref]);

            if (rows[0].hack < 5 && Math.floor(Math.random() * (5 - 1 + 1) + 1) > 3 ) {
                await conn.query("UPDATE users SET hack=hack+1,points=points+? WHERE referral=?", [Math.floor(Math.random() * (60 - 50 + 1) + 50),ref]);
            }

            res.send(`<p style="color:#FF0000">INTERNAL SERVER ERROR</p>`);
        } catch (err) {
            console.log(err);
        } finally {
            if (conn) conn.release();
        }
    })
});

export default router;