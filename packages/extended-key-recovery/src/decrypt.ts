import * as forge from 'node-forge';

const _unpad = (text: Buffer, k = 16): Buffer => {
  const nl = text.length;
  const val = text[nl - 1];
  if (val > k) {
    throw new Error('Input is not padded or padding is corrupt');
  }
  if (!text.subarray(nl - val, nl).every((x) => x === val)) {
    throw new Error('Input is not padded or padding is corrupt');
  }
  const l_idx = nl - val;
  return text.subarray(0, l_idx);
};

export const decryptMobilePrivateKey = (pass: string, userId: string, encryptedKey: Buffer): Buffer => {
  const wrappedKey = forge.pkcs5.pbkdf2(pass, userId, 10000, 32, 'sha1');
  const decipher = forge.cipher.createDecipher(
    'AES-CBC',
    forge.util.createBuffer(new Uint8Array(Buffer.from(wrappedKey, 'binary'))),
  );
  decipher.start({ iv: new Array(16).fill(0) });
  decipher.update(forge.util.createBuffer(new Uint8Array(encryptedKey)));
  decipher.finish();

  const decryptedBytes = Buffer.from(decipher.output.toHex(), 'hex');
  if (decryptedBytes.length === 48) {
    const unpaddedData = _unpad(decryptedBytes);
    return unpaddedData;
  }
  return decryptedBytes;
};
