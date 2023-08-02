import { config } from 'dotenv';
import { createApp } from './utils/createApp';
import { pool } from './client/database';
const logger = require("./utils/logger")

config();

const PORT = process.env.PORT || 3001;

async function main() {
    try {
        const app = createApp();
        app.listen(PORT, () => console.log(`Running on Port ${PORT}`));
    } catch (err) {
        console.log(err);
    }

    try {
        pool.getConnection().then((con) => {
            logger.info("Connected to database.");
            con.release();
        });
    } catch (error) {
        logger.error(error)
    }
}

main();