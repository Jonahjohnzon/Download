// ── Helpers ───────────────────────────────────────────────────────────────────

function base64ToBytes(str) {
    const binary = atob(str.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function getKeyBytes(key) {
    const encoded = new TextEncoder().encode(key);
    const result = new Uint8Array(32); // pad/truncate to 32 bytes like CryptoJS
    result.set(encoded.slice(0, 32));
    return result;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function decrypt(encryptedData, decryptionKey) {
    try {
        if (!encryptedData || !decryptionKey) return '';

        const decoded = atob(encryptedData);
        const [ivBase64, cipherBase64] = decoded.split(':');
        if (!ivBase64 || !cipherBase64) return '';

        const iv          = base64ToBytes(ivBase64);
        const cipherBytes = base64ToBytes(cipherBase64);
        const keyBytes    = getKeyBytes(decryptionKey);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyBytes,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            cipherBytes
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        return '';
    }
}

export async function deriveKey(e) {
    try {
        if (!e) return '';

        const bytes = base64ToBytes(e);
        if (bytes.length <= 28) return '';

        const iv         = bytes.slice(0, 12);
        const tag        = bytes.slice(12, 28);
        const cipherText = bytes.slice(28);

        // combine ciphertext + tag for AES-GCM
        const combined = new Uint8Array(cipherText.length + tag.length);
        combined.set(cipherText, 0);
        combined.set(tag, cipherText.length);

        // derive AES-GCM key from fixed salt
        const salt = new TextEncoder().encode('4f2a9c7d1e8b3a6f0d5c2e9a7b1f4d8c');
        const keyMaterial = await crypto.subtle.digest('SHA-256', salt);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyMaterial,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv, tagLength: 128 },
            cryptoKey,
            combined
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        return '';
    }
}