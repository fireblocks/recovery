import { encode } from "base64-arraybuffer";

export const encryptString = async (message: string, passphrase: string) => {
  const messageBytes = new TextEncoder().encode(message);

  const passphraseBytes = new TextEncoder().encode(passphrase);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt"]
  );

  const encryptedMessageBytes = await window.crypto.subtle.encrypt(
    { iv, name: "AES-GCM" },
    key,
    messageBytes
  );

  const encryptedPayloadBytes = new Uint8Array(
    iv.byteLength + salt.byteLength + encryptedMessageBytes.byteLength
  );

  encryptedPayloadBytes.set(new Uint8Array(iv), 0);

  encryptedPayloadBytes.set(new Uint8Array(salt), iv.byteLength);

  encryptedPayloadBytes.set(
    new Uint8Array(encryptedMessageBytes),
    iv.byteLength + salt.byteLength
  );

  const encryptedPayloadBase64 = encode(encryptedPayloadBytes);

  return encryptedPayloadBase64;
};
