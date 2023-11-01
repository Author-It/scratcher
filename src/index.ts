import { config } from 'dotenv';
import { createApp } from './utils/createApp';
import { pool } from './client/database';
const logger = require("./utils/logger")

config();

const PORT = process.env.PORT || 3001;

async function main() {
    try {
        const app = await createApp();
        app.listen(PORT, () => logger.event(`Running on Port ${PORT}`));
    } catch (err) {
        console.log(err);
    }

    let conn;
    try {
        conn = await pool.getConnection();

        logger.event("CONNECTED TO DATABASE");
    } catch (error) {
        logger.error(error)
    } finally {
        if (conn) conn.release();
    }
}

main();