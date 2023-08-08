import { config } from 'dotenv';
import express, { Express } from 'express';
import routes from '../routes';
config();

export function createApp(): Express {
    const app = express();
    // Enable Parsing Middleware for Requests
    app.use(express.json());
    app.use(express.urlencoded({extended:true}));

    // app.use((req, res, next) => setTimeout(() => next(), 800));

    app.use('/api', routes);

    app.get("/", (req, res) => {
        res.send("Works");
    });

    return app;
}