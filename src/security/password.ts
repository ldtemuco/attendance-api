const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256;

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function derivePassword(
    password: string,
    salt: Uint8Array,
    iterations: number
): Promise<Uint8Array> {

    const passwordBytes = new TextEncoder().encode(password);

    const key = await crypto.subtle.importKey(
        "raw",
        passwordBytes,
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt,
            iterations
        },
        key,
        HASH_LENGTH
    );

    return new Uint8Array(derived);
}

export async function hashPassword(password: string): Promise<string> {

    const salt = crypto.getRandomValues(
        new Uint8Array(SALT_LENGTH)
    );

    const hash = await derivePassword(
        password,
        salt,
        ITERATIONS
    );

    return [
        "pbkdf2-sha256",
        ITERATIONS,
        bytesToBase64(salt),
        bytesToBase64(hash)
    ].join("$");
}

export async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {

    const parts = storedHash.split("$");

    if (parts.length !== 4) {
        return false;
    }

    const [algorithm, iterationsText, saltText, hashText] = parts;

    if (algorithm !== "pbkdf2-sha256") {
        return false;
    }

    const iterations = Number(iterationsText);

    if (!Number.isInteger(iterations) || iterations <= 0) {
        return false;
    }

    const salt = base64ToBytes(saltText);
    const expectedHash = base64ToBytes(hashText);

    const actualHash = await derivePassword(
        password,
        salt,
        iterations
    );

    if (actualHash.length !== expectedHash.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < actualHash.length; i++) {
        difference |= actualHash[i] ^ expectedHash[i];
    }

    return difference === 0;
}