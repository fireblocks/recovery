import binascii
import hashlib
from abc import ABC

import base58
from bip32 import BIP32

from com.fireblocks.drs.crypto.basic import BaseRecovery, DERIVATION_PURPOSE
from com.fireblocks.drs.crypto.derivation import Derivation


class EcDSARecovery(BaseRecovery, ABC):
    def __init__(
        self,
        xprv: str,
        coin_type: Derivation = Derivation.Bitcoin,
        account: int = 0,
        change: int = 0,
        address_index: int = 0,
        testnet: bool = False,
    ):
        """
        See https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki for more details.
        See https://github.com/satoshilabs/slips/blob/master/slip-0044.md for derivations.

        The class will compute 4 attributes:
        - private_key, public_key - the int that represents the private and public key correspondingly.
        - prv_hex, pub_hex - the hex representation of the private and public keys correspondingly.

        :param xprv: The extended private key that has been retrieved by the hard key Recovery Kit.
        :param coin_type: (optional) Choose one of the coins as shown in Derivation class
        :param account: (optional) Vault account. Leave empty if default vault.
        :param change: (optional)
        :param address_index: (optional)
        """
        self.account = account
        self.coin_id = coin_type.value if not testnet else Derivation.Testnet.value
        self.change = change
        self.address_index = address_index
        self.private_key = int.from_bytes(
            BIP32.from_xpriv(xprv).get_extended_privkey_from_path(
                [DERIVATION_PURPOSE, self.coin_id, account, change, address_index]
            )[1],
            byteorder="big",
        )
        self.public_key = int.from_bytes(
            BIP32.from_xpriv(xprv).get_extended_pubkey_from_path(
                [DERIVATION_PURPOSE, self.coin_id, account, change, address_index]
            )[1],
            byteorder="big",
        )

        # Private key hex
        hex_inter_value = hex(self.private_key)[2:]
        self.prv_hex = (
            f"0{hex_inter_value}"
            if len(hex_inter_value) % 2 != 0
            else f"{hex_inter_value}"
        )

        # Public key hex
        hex_inter_value = hex(self.public_key)[2:]
        self.pub_hex = (
            f"0{hex_inter_value}"
            if len(hex_inter_value) % 2 != 0
            else f"{hex_inter_value}"
        )

        # Private key WIF
        # Adding 0x80 byte in front (must) and 0x01 byte in the end (as it corresponds to compressed public key).
        full_private_key = "80" + self.prv_hex + "01"
        full_private_key_bytes = binascii.unhexlify(full_private_key)
        first_hash = hashlib.sha256(full_private_key_bytes).hexdigest().encode()
        second_hash = hashlib.sha256(first_hash).hexdigest()
        wif_checksum = second_hash[:8]
        wif_hex = full_private_key + wif_checksum
        wif_bytes = bytes.fromhex(wif_hex)
        wif_base_58_bytes = base58.b58encode(wif_bytes)
        self.wif = wif_base_58_bytes.decode()
