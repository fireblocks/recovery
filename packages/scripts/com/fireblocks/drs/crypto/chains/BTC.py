import hashlib
import binascii

from com.fireblocks.drs.crypto.basic import DERIVATION_PURPOSE
from com.fireblocks.drs.crypto.derivation import Derivation
from com.fireblocks.drs.crypto.ecdsa_basic import EcDSARecovery
from com.fireblocks.drs.infra.dynamic_loader import get_dep

btcutils_setup = get_dep("bitcoinutils.setup")
btcutils_keys = get_dep("bitcoinutils.keys")
BIP32 = get_dep("bip32").BIP32

setup = btcutils_setup.setup
P2wpkhAddress = btcutils_keys.P2wpkhAddress
P2wshAddress = btcutils_keys.P2wshAddress
P2shAddress = btcutils_keys.P2shAddress
PrivateKey = btcutils_keys.PrivateKey
PublicKey = btcutils_keys.PublicKey


class BitcoinRecovery(EcDSARecovery):
    def __init__(self,
                 xprv: str,
                 account: int = 0,
                 change: int = 0,
                 address_index: int = 0):
        super().__init__(xprv=xprv, coin_type=Derivation.Bitcoin, account=account, change=change,
                         address_index=address_index)
        self.address = self.to_address()
        self.legacy_address = self.to_address(legacy=True)

    def to_address(self, testnet: bool = False, legacy: bool = False) -> str:
        if testnet:
            setup('testnet')
        else:
            setup('mainnet')

        if legacy:
            return PublicKey.from_hex(self.pub_hex).get_address().to_string()

        return PublicKey.from_hex(self.pub_hex).get_segwit_address().to_string()

    @staticmethod
    def public_key_verification(extended_pub: str,
                                account: int = 0,
                                change: int = 0,
                                address_index: int = 0,
                                testnet: bool = False,
                                legacy: bool = False) -> (str, str):
        pub = int.from_bytes(BIP32.from_xpub(extended_pub).get_extended_pubkey_from_path([
            DERIVATION_PURPOSE,
            Derivation.Bitcoin.value if not testnet else Derivation.Testnet.value,
            account,
            change,
            address_index
        ])[1], byteorder="big")
        hex_inter_value = hex(pub)[2:]
        pub_hex = f"0{hex_inter_value}" if len(hex_inter_value) % 2 != 0 else f"{hex_inter_value}"

        return pub_hex, (PublicKey.from_hex(pub_hex).get_address().to_string() if legacy else
                         PublicKey.from_hex(pub_hex).get_segwit_address().to_string())
