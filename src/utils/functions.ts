import forge from "node-forge"
import { PRIVATE_KEY } from "./constants"
import { pool } from "../client/database"

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
        if (conn) conn.release();
    }
}