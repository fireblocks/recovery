import { decode } from "base64-arraybuffer";
import { getEncryptionKey } from "shared";

export const decryptString = async (
  encryptedPayloadBase64: string,
  passphrase: string
) => {
  const encryptedPayloadBytes = decode(encryptedPayloadBase64);

  const passphraseBytes = new TextEncoder().encode(passphrase);

  const iv = encryptedPayloadBytes.slice(0, 12);

  const salt = encryptedPayloadBytes.slice(12, 28);

  const encryptedMessage = encryptedPayloadBytes.slice(28);

  const key = await getEncryptionKey(passphraseBytes, salt);

  const decryptedMessageBytes = await window.crypto.subtle.decrypt(
    { iv, name: "AES-GCM" },
    key,
    encryptedMessage
  );

  const decryptedMessage = new TextDecoder().decode(decryptedMessageBytes);

  return decryptedMessage;
};
