import base64
import hashlib
import json
import struct
import uuid
from collections import defaultdict
from io import BytesIO
from zipfile import ZipFile

from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.PublicKey import RSA

from com.fireblocks.drs.crypto import ed25519
from com.fireblocks.drs.infra.recovery.curve import secp256k1
from com.fireblocks.drs.infra.recovery.recovery_helper import encode_base58_checksum

pubkey_prefix = {
    "MPC_ECDSA_SECP256K1": 0x0488B21E,
    "MPC_CMP_ECDSA_SECP256K1": 0x0488B21E,
    "MPC_EDDSA_ED25519": 0x03273E4B,
    "MPC_CMP_EDDSA_ED25519": 0x03273E4B,
}

privkey_prefix = {
    "MPC_ECDSA_SECP256K1": 0x0488ADE4,
    "MPC_CMP_ECDSA_SECP256K1": 0x0488ADE4,
    "MPC_EDDSA_ED25519": 0x03273A10,
    "MPC_CMP_EDDSA_ED25519": 0x03273A10,
}

algorithm_enum_mapping = {
    "MPC_ECDSA_SECP256K1": 0,
    "MPC_CMP_ECDSA_SECP256K1": 0,
    "MPC_EDDSA_ED25519": 1,
    "MPC_CMP_EDDSA_ED25519": 1,
}


class RecoveryException(Exception):
    pass


class RecoveryErrorMetadataNotFound(RecoveryException):
    def __init__(self, zip_file_path):
        self._zip_file_path = zip_file_path

    def __str__(self):
        return "Backup zip %s doesn't contain metadata.json" % self._zip_file_path


class RecoveryErrorPublicKeyNoMatch(RecoveryException):
    def __str__(self):
        return (
            "Computed public key does not match expected public key (zip inconsistency)"
        )


class RecoveryErrorKeyIdNotInMetadata(RecoveryException):
    def __init__(self, key_id):
        self._key_id = key_id

    def __str__(self):
        return (
            "Found key id %s in zip file, but it doesn't exist in metadata.json"
            % self._key_id
        )


class RecoveryErrorKeyIdMissing(RecoveryException):
    def __init__(self, key_id):
        self._key_id = key_id

    def __str__(self):
        return (
            "metadata.json contains key id %s, which wasn't found in zip file"
            % self._key_id
        )


class RecoveryErrorUnknownAlgorithm(RecoveryException):
    def __init__(self, algo):
        self._algo = algo

    def __str__(self):
        return "metadata.json contains unsupported signature algorithm %s" % self._algo


class RecoveryErrorUnknownChainCode(RecoveryException):
    def __str__(self):
        return "Chain code is metadata.json is missing or invalid "


class RecoveryErrorMobileKeyDecrypt(RecoveryException):
    def __str__(self):
        return "Mobile key decryption error"


class RecoveryErrorRSAKeyImport(RecoveryException):
    def __str__(self):
        return "Error importing the RSA key for the ZIP file"


class RecoveryErrorMobileRSAKeyImport(RecoveryException):
    def __str__(self):
        return "Error importing the RSA key for the mobile share"


class RecoveryErrorMobileRSADecrypt(RecoveryException):
    def __str__(self):
        return "Error decrypting mobile key share"


def recover(
    zip_file: str,
    zip_prv_key: str,
    mobile_passphrase: str,
    zip_prv_key_pass: str = None,
):
    ECDSA = "MPC_ECDSA_SECP256K1"
    EDDSA = "MPC_EDDSA_ED25519"
    recovered_keys = restore_key_and_chaincode(
        zip_file, zip_prv_key, mobile_passphrase, zip_prv_key_pass
    )
    ecdsa_prv_key, ecdsa_chaincode = recovered_keys[ECDSA]
    eddsa_prv_key, eddsa_chaincode = recovered_keys[EDDSA]
    ecdsa_pub_key = get_public_key(ECDSA, ecdsa_prv_key)
    eddsa_pub_key = get_public_key(EDDSA, eddsa_prv_key)

    xprv = encode_extended_key(ECDSA, ecdsa_prv_key, ecdsa_chaincode, False)
    fprv = encode_extended_key(EDDSA, eddsa_prv_key, eddsa_chaincode, False)
    xpub = encode_extended_key(ECDSA, ecdsa_pub_key, ecdsa_chaincode, True)
    fpub = encode_extended_key(EDDSA, eddsa_pub_key, eddsa_chaincode, True)

    return {"xprv": xprv, "fprv": fprv, "xpub": xpub, "fpub": fpub}


def restore_key_and_chaincode(
    zip_file_b64: str,
    zip_prv_key_b64: str,
    mobile_passphrase: str,
    zip_prv_key_pass: str = None,
):
    privkeys = {}
    players_data = defaultdict(dict)
    key_metadata_mapping = {}

    zip_file = base64.b64decode(zip_file_b64)
    key_pem = base64.b64decode(zip_prv_key_b64)

    try:
        key = RSA.importKey(key_pem, passphrase=zip_prv_key_pass)
    except ValueError:
        raise RecoveryErrorRSAKeyImport()

    cipher = PKCS1_OAEP.new(key)
    with ZipFile(BytesIO(zip_file), "r") as z:
        if "metadata.json" not in z.namelist():
            raise Exception("Missing metadata json from ZIP file")
        with z.open("metadata.json") as file:
            obj = json.loads(file.read())
            default_chain_code = bytes.fromhex(obj["chainCode"])
            if "keys" in obj:
                keys_in_backup = obj["keys"]
            else:
                # backward compatibility: backup includes just one ECDSA key
                keys_in_backup = {
                    obj["keyId"]: {
                        "publicKey": obj["publicKey"],
                        "algo": "MPC_ECDSA_SECP256K1",
                    }
                }
            for key_id, key_metadata in keys_in_backup.items():
                metadata_public_key = key_metadata["publicKey"]
                algo = key_metadata["algo"]
                # Some keys may have their own chaincode specified
                # If a chaincode defintion exists for a specific key, use that.
                # if not, use the "default" chaincode defined at the top of metadata.json
                if "chainCode" in key_metadata:
                    chain_code_for_this_key = bytes.fromhex(key_metadata["chainCode"])
                else:
                    chain_code_for_this_key = default_chain_code
                if len(chain_code_for_this_key) != 32:
                    raise RecoveryErrorUnknownChainCode()
                key_metadata_mapping[key_id] = (
                    algo,
                    metadata_public_key,
                    chain_code_for_this_key,
                )

        for name in z.namelist():
            with z.open(name) as file:
                if name.startswith("MOBILE"):
                    obj = json.loads(file.read())
                    key_id = obj["keyId"]
                    if key_id not in key_metadata_mapping:
                        raise RecoveryErrorKeyIdNotInMetadata(key_id)
                    try:
                        data = decrypt_mobile_private_key(
                            mobile_passphrase.encode(),
                            obj["userId"].encode(),
                            bytes.fromhex(obj["encryptedKey"]),
                        )
                    except ValueError:
                        raise RecoveryErrorMobileKeyDecrypt()

                    # if the decrypted data is a json object try to decode it and use the "key" value
                    # noinspection PyBroadException
                    try:
                        recover_data_object = json.loads(data.decode())
                        data = bytearray.fromhex(recover_data_object["key"])
                    except:
                        pass

                    if (
                        len(data) == 36
                    ):  # the first 4 bytes encode the algorithm, and the rest is the private share
                        algo = int.from_bytes(data[:4], byteorder="little")
                        if (
                            algorithm_enum_mapping[key_metadata_mapping[key_id][0]]
                            != algo
                        ):
                            raise RecoveryErrorUnknownAlgorithm(algo)
                        data = data[4:]
                    players_data[key_id][
                        get_player_id(key_id, obj["deviceId"], False)
                    ] = int.from_bytes(data, byteorder="big")
                elif name == "metadata.json":
                    continue
                else:
                    if "_" in name:
                        cosigner_id, key_id = name.split("_")
                    else:
                        # backward compatibility: backup includes just one ECDSA key
                        if (
                            len(key_metadata_mapping) == 1
                        ):  # len > 1 means new format, so ignore old format files
                            cosigner_id = name
                            key_id = list(key_metadata_mapping.keys())[0]
                        else:
                            key_id = None

                    if key_id:
                        data = cipher.decrypt(file.read())
                        players_data[key_id][
                            get_player_id(key_id, cosigner_id, True)
                        ] = int.from_bytes(data, byteorder="big")

    for key_id in key_metadata_mapping:
        if key_id not in players_data:
            raise RecoveryErrorKeyIdMissing(key_id)

    for key_id, key_players_data in players_data.items():
        algo = key_metadata_mapping[key_id][0]
        chain_code_for_this_key = key_metadata_mapping[key_id][2]
        prv_key, pubkey_str = calculate_keys(key_id, key_players_data, algo)

        pub_from_metadata = key_metadata_mapping[key_id][1]
        if pub_from_metadata != pubkey_str:
            print(
                f"Failed to recover {algo} key, expected public key is: {pub_from_metadata} calculated public key is: "
                f"{pubkey_str}"
            )
            privkeys[algo] = None
        else:
            privkeys[algo] = prv_key, chain_code_for_this_key

    if len(privkeys) == 0:
        raise RecoveryErrorPublicKeyNoMatch()
    return privkeys


def get_public_key(algo, private_key):
    prv_key = private_key
    if type(private_key) != int:
        prv_key = int.from_bytes(private_key, byteorder="big")
    if algo == "MPC_ECDSA_SECP256K1" or algo == "MPC_CMP_ECDSA_SECP256K1":
        pubkey = secp256k1.G * prv_key
        return pubkey.serialize()
    elif algo == "MPC_EDDSA_ED25519" or algo == "MPC_CMP_EDDSA_ED25519":
        pubkey = ed25519.scalarmult(ed25519.B, prv_key)
        return "00" + _ed25519_point_serialize(pubkey)
    else:
        raise RecoveryErrorUnknownAlgorithm(algo)


def restore_private_key(zip_path, private_pem_path, passphrase, key_pass=None):
    return restore_key_and_chaincode(zip_path, private_pem_path, passphrase, key_pass)


def encode_extended_key(algo, key, chain_code, is_pub):
    if type(key) == int:
        key = key.to_bytes(32, byteorder="big")
    elif type(key) == str:
        key = bytes.fromhex(key)

    if is_pub:
        extended_key = pubkey_prefix[algo].to_bytes(4, byteorder="big")  # prefix
    else:
        extended_key = privkey_prefix[algo].to_bytes(4, byteorder="big")  # prefix
    extended_key += bytes(1)  # depth
    extended_key += bytes(4)  # fingerprint
    extended_key += bytes(4)  # child number
    extended_key += chain_code  # chain code

    if not is_pub:
        extended_key += bytes(1)
    extended_key += key
    return encode_base58_checksum(extended_key)


def _unpad(text, k=16):
    nl = len(text)
    val = int(text[-1])
    if val > k:
        raise ValueError("Input is not padded or padding is corrupt")
    if not all([x == val for x in text[nl - val : nl]]):
        raise ValueError("Input is not padded or padding is corrupt")
    l_idx = nl - val
    return text[:l_idx]


def decrypt_mobile_private_key(recovery_password, user_id, encrypted_key):
    wrap_key = hashlib.pbkdf2_hmac("sha1", recovery_password, user_id, 10000, 32)
    iv = bytes(chr(0) * 16, "utf-8")
    cipher = AES.new(wrap_key, AES.MODE_CBC, iv)
    prv_key = _unpad(cipher.decrypt(encrypted_key))
    return prv_key


def _ed25519_point_serialize(p):
    if p[0] & 1:
        return (p[1] + 2**255).to_bytes(32, byteorder="little").hex()
    else:
        return (p[1]).to_bytes(32, byteorder="little").hex()


def get_player_id(key_id, cosigner_id, is_cloud):
    if is_cloud:
        key_id_first_dword = uuid.UUID(key_id).int.to_bytes(16, "big")[0:4]
        player_id = int(cosigner_id) << 32 | struct.unpack("I", key_id_first_dword)[0]
    else:
        cosigner_prefix = list(uuid.UUID(cosigner_id).int.to_bytes(16, "big")[0:6])
        cosigner_prefix.reverse()
        player_id = struct.unpack("Q", bytes(cosigner_prefix) + struct.pack("h", 0))[0]
    return player_id


def _prime_mod_inverse(x, p):
    return pow(x, p - 2, p)


# noinspection PyShadowingBuiltins
def lagrange_coefficient(my_id, ids, field):
    coefficient = 1
    for id in ids:
        if id == my_id:
            continue

        tmp = _prime_mod_inverse((id - my_id) % field, field)
        tmp = (tmp * id) % field
        coefficient *= tmp
    return coefficient


def calculate_keys(key_id, player_to_data, algo):
    if algo == "MPC_ECDSA_SECP256K1":
        prv_key = 0
        for key, value in player_to_data.items():
            prv_key = (
                prv_key
                + value * lagrange_coefficient(key, player_to_data.keys(), secp256k1.q)
            ) % secp256k1.q

        pubkey = secp256k1.G * prv_key
        return prv_key, pubkey.serialize()
    elif algo == "MPC_EDDSA_ED25519":
        prv_key = 0
        for key, value in player_to_data.items():
            prv_key = (
                prv_key
                + value * lagrange_coefficient(key, player_to_data.keys(), ed25519.l)
            ) % ed25519.l

        pubkey = ed25519.scalarmult(ed25519.B, prv_key)
        return prv_key, _ed25519_point_serialize(pubkey)
    if algo == "MPC_CMP_ECDSA_SECP256K1":
        prv_key = 0
        for key, value in player_to_data.items():
            prv_key = (prv_key + value) % secp256k1.q

        pubkey = secp256k1.G * prv_key
        return prv_key, pubkey.serialize()
    elif algo == "MPC_CMP_EDDSA_ED25519":
        prv_key = 0
        for key, value in player_to_data.items():
            prv_key = (prv_key + value) % ed25519.l

        pubkey = ed25519.scalarmult(ed25519.B, prv_key)
        return prv_key, _ed25519_point_serialize(pubkey)
    else:
        raise RecoveryErrorUnknownAlgorithm(algo)
