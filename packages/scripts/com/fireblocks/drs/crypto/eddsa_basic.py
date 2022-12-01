from abc import ABC

from com.fireblocks.drs.crypto.basic import BaseRecovery
from com.fireblocks.drs.crypto.derivation import Derivation
from com.fireblocks.drs.crypto.eddsa_sign import eddsa_derive

# noinspection PyAbstractClass
from com.fireblocks.drs.infra.exceptions import UnsupportedException


class EdDSARecovery(BaseRecovery, ABC):

    def __init__(self,
                 fprv: str,
                 coin_type: Derivation,
                 account: int = 0,
                 change: int = 0,
                 address_index: int = 0,
                 testnet: bool = False):
        """
        See https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki for more details.
        See https://github.com/satoshilabs/slips/blob/master/slip-0044.md for derivations.

        The class will compute 4 attributes:
        - private_key, public_key - the int that represents the private and public key correspondingly.
        - prv_hex, pub_hex - the hex representation of the private and public keys correspondingly.

        :param fprv: The fireblocks format extended private key that has been retrieved by the hard key recovery kit.
        :param coin_type: (optional) Choose one of the coins as shown in Derivation class
        :param account: (optional) Vault account. Leave empty if default vault.
        :param change: (optional)
        :param address_index: (optional)
        """
        self.account = account
        self.coin_id = coin_type.value if not testnet else Derivation.Testnet.value
        self.change = change
        self.address_index = address_index
        self.private_key, self.pub_hex = eddsa_derive(fprv,
                                                      f"44/{self.coin_id}/{account}/{change}/{address_index}")
        self.prv_hex = hex(self.private_key)[2:]
        self.public_key = int.from_bytes(self.pub_hex, byteorder="little")
        self.pub_hex = self.pub_hex.hex()

    def to_import_format(self) -> str:
        raise UnsupportedException("Wallet Import Format is not supported for EdDSA assets.")
