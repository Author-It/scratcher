import forge from "node-forge"
import { PRIVATE_KEY } from "./constants"

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