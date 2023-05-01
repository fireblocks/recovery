import sys
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256

if len(sys.argv) != 4 and len(sys.argv) != 5:
    sys.exit(2)

TYPE = sys.argv[1]
rsa_file = base64.b64decode(sys.argv[2])
ciphertext = base64.b64decode(sys.argv[3])
if len(sys.argv) == 5:
    passphrase = base64.b64decode(sys.argv[4])
else:
    passphrase = None

try:
    key = RSA.importKey(rsa_file, passphrase=passphrase)
except ValueError:
    sys.exit(3)

if TYPE == "1":
    cipher = PKCS1_OAEP.new(key)
else:
    cipher = PKCS1_OAEP.new(key, SHA256)

dec_data = cipher.decrypt(ciphertext)
print(hex(int.from_bytes(dec_data, byteorder="big")))
sys.exit(0)
