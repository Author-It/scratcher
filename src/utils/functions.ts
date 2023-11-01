import forge from "node-forge";
import { PRIVATE_KEY, weightedProbabilities, weightedProbabilities100 } from "./constants";
import { pool } from "../client/database";
import fs from "fs";
import { parse } from "csv-parse"

const { google } = require("googleapis");

const MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const SCOPES = [MESSAGING_SCOPE];

export async function storeHash(hash: string) {
    let conn;
    try {
        conn = await pool.getConnection();
        const check = await conn.query("SELECT * FROM requests WHERE reqs=?", [hash]);
        if (check[0]) return -1;

        await conn.query("INSERT INTO requests (reqs) VALUES (?)", [hash]);
        return 0;
    } catch (err) {
        console.log(err);
        return -1;
    } finally {
        if (conn) conn.release();
    }
}

export async function decryptRSA(encryptedBase64: string) {

    try {
        const privateKeyPEM = forge.pki.privateKeyFromPem(PRIVATE_KEY);
        const encryptedBytes = forge.util.decode64(encryptedBase64);

        const store = await storeHash(encryptedBase64);
        if (store === -1) return `{fingerprint: "meow"}`;

        const decrypt = privateKeyPEM.decrypt(encryptedBytes, "RSAES-PKCS1-V1_5");
        const decrypredString = decrypt.toString();

        return decrypredString;
    } catch (error) {
        console.log(error);
        return "0";
    }
}

function weightedRand2(spec: any) {
    var i, sum = 0, r = Math.random();
    for (i in spec) {
        sum += spec[i];
        if (r <= sum) return parseInt(i);
    }
}

export function getNextAmt(points: number) {

    let a;

    if (points > 5000) {
        a = weightedRand2(weightedProbabilities);
        if (a === undefined) a = 32;
    } else {
        a = weightedRand2(weightedProbabilities100);
        if (a === undefined) a = 12;
    }

    return a;
}

function getRandMail() {
    return new Promise((resolve, reject) => {
        const rows: string[] = [];

        fs.createReadStream(process.cwd() + "/assets/save_file.csv")
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", function (row) {
                rows.push(row["0"]);
            })
            .on("end", function () {
                resolve(rows); // Resolve the Promise with the data when reading is complete
            })
            .on("error", function (error) {
                reject(error); // Reject the Promise if there's an error
            });
    });
}

export async function naam(): Promise<string[]> {

    const rows: any = await getRandMail();

    const send: string[] = [];

    for (let i = 0; i < 25; i++) {
        const a = Math.floor(Math.random() * (5000 - 5 + 1) + 5);

        send.push("*****" + rows[a].slice(4));
    }

    return send;
}

export function getAccessToken() {
    return new Promise(function (resolve, reject) {
        const key = require("../../assets/service.json");
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err: any, tokens: any) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}