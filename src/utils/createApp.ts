import { config } from 'dotenv';
import express, { Express } from 'express';
import routes from '../routes';
import { naam } from './functions';
config();

export async function createApp(): Promise<express.Express> {
    const app = express();
    // Enable Parsing Middleware for Requests
    app.use(express.json());
    app.use(express.urlencoded({extended:true}));

    const mails = await naam()

    app.use('/api', routes);

    app.get("/", (req, res) => {
        res.send("Works");

        // req.app.set("emails", mails);
    });

    app.set("emails", mails)

    return app;
}