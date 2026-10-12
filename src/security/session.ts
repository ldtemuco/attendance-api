const TOKEN_LENGTH = 32;

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function generateSessionToken(): string {
    const bytes = crypto.getRandomValues(
        new Uint8Array(TOKEN_LENGTH)
    );

    return bytesToBase64Url(bytes);
}

export async function hashSessionToken(
    token: string
): Promise<string> {

    const data = new TextEncoder().encode(token);

    const digest = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    return bytesToHex(
        new Uint8Array(digest)
    );
}