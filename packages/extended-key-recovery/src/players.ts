import struct from 'python-struct';

export const _uuidToBuffer = (uuid: string): Buffer =>
  Buffer.from(uuid.replace('uuid:', '').replace('urn:', '').replace('-', ''), 'hex');

export const getPlayerId = (keyId: string, deviceId: string, isCloud: boolean): bigint => {
  let playerId;
  if (isCloud) {
    const keyIdFirstDword = _uuidToBuffer(keyId).subarray(0, 4);
    playerId = (BigInt(deviceId) << BigInt(32)) | BigInt((struct.unpack('I', keyIdFirstDword)[0] as Long).toString());
  } else {
    const cosignerPrefix = _uuidToBuffer(deviceId).subarray(0, 6).reverse();
    playerId = BigInt(struct.unpack('Q', Buffer.concat([cosignerPrefix, struct.pack('h', 0)]))[0].toString());
  }
  return playerId;
};
