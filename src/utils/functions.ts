import forge from "node-forge";
import { PRIVATE_KEY, weightedProbabilities } from "./constants";
import { pool } from "../client/database";
import fs from "fs";
import { parse } from "csv-parse"

export async function decryptRSA(encryptedBase64: string) {

    try {
        const privateKeyPEM = forge.pki.privateKeyFromPem(PRIVATE_KEY);
        const encryptedBytes = forge.util.decode64(encryptedBase64);

        const decrypt = privateKeyPEM.decrypt(encryptedBytes, "RSAES-PKCS1-V1_5");
        const decrypredString = decrypt.toString();

        return decrypredString;
    } catch (error) {
        console.log(error);
        return "0";
    }
}

export async function addPointsHistory(
    uid: string,
    amount: number,
    source: string,
    id: string
) {
    if (!uid || !amount || !source || !id) return;

    let conn;
    try {
        conn = await pool.getConnection();
        const user = await conn.query(`SELECT pointsHistory from users WHERE uid=?`, [uid]);
        const pointHistory = JSON.parse(user[0].pointsHistory).history;

        const data = {};
        Object.assign(data, { amount: amount }, { source: source }, { id: id });
        pointHistory.push(data);
        await conn.query(`UPDATE users SET pointsHistory=? WHERE uid=?`, [
            JSON.stringify({ history: pointHistory }),
            uid,
        ]);
    } catch (error) {
        console.log(error);
    } finally {
        if (conn) await conn.release();
    }
}

function weightedRand2(spec: any) {
    var i, sum = 0, r = Math.random();
    for (i in spec) {
        sum += spec[i];
        if (r <= sum) return parseInt(i);
    }
}

export function getNextAmt() {
    let a = weightedRand2(weightedProbabilities);

    if (a === undefined) a = 35;

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

    const rows:any = await getRandMail();

    const send: string[] = [];

    for (let i = 0; i < 5; i++) {
        const a = Math.floor(Math.random() * (5000 - 5 + 1) + 5);

        send.push("*****" + rows[a].slice(4));
    }

    return send;
}