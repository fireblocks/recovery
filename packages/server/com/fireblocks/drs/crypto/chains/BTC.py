from bip32 import BIP32
from bitcoinutils.keys import PublicKey
from bitcoinutils.setup import setup

from com.fireblocks.drs.crypto.basic import DERIVATION_PURPOSE, DerivationDetails
from com.fireblocks.drs.crypto.derivation import Derivation
from com.fireblocks.drs.crypto.ecdsa_basic import EcDSARecovery
from com.fireblocks.drs.crypto.tx import TxRequest, TxResponse


class BitcoinRecovery(EcDSARecovery):
    def __init__(
        self,
        xprv: str,
        account: int = 0,
        change: int = 0,
        address_index: int = 0,
        testnet: bool = False,
    ):
        super().__init__(
            xprv=xprv,
            coin_type=Derivation.Bitcoin,
            account=account,
            change=change,
            address_index=address_index,
            testnet=testnet,
        )
        self.address = self.to_address()
        self.legacy_address = self.to_address(legacy=True)

    def to_address(self, testnet: bool = False, legacy: bool = False) -> str:
        if testnet:
            setup("testnet")
        else:
            setup("mainnet")

        if legacy:
            return PublicKey.from_hex(self.pub_hex).get_address().to_string()

        return PublicKey.from_hex(self.pub_hex).get_segwit_address().to_string()

    def get_derivation_details(self, **kwargs) -> DerivationDetails:
        testnet = kwargs.get("testnet", False)
        legacy = kwargs.get("legacy", False)
        if testnet:
            setup("testnet")
        else:
            setup("mainnet")
        return DerivationDetails(
            self.wif,
            self.prv_hex,
            self.pub_hex,
            self.to_address(testnet, legacy),
            f"44,{self.coin_id},{self.account},{self.change},{self.address_index}",
        )

    @staticmethod
    def public_key_verification(
        extended_pub: str,
        account: int = 0,
        change: int = 0,
        address_index: int = 0,
        **kwargs,
    ) -> (str, str):
        legacy = kwargs.get("legacy", False)
        testnet = kwargs.get("testnet", False)
        if testnet:
            setup("testnet")
        else:
            setup("mainnet")
        pub = int.from_bytes(
            BIP32.from_xpub(extended_pub).get_extended_pubkey_from_path(
                [
                    DERIVATION_PURPOSE,
                    Derivation.Bitcoin.value
                    if not testnet
                    else Derivation.Testnet.value,
                    account,
                    change,
                    address_index,
                ]
            )[1],
            byteorder="big",
        )
        hex_inter_value = hex(pub)[2:]
        pub_hex = (
            f"0{hex_inter_value}"
            if len(hex_inter_value) % 2 != 0
            else f"{hex_inter_value}"
        )
        return pub_hex, (
            PublicKey.from_hex(pub_hex).get_address().to_string()
            if legacy
            else PublicKey.from_hex(pub_hex).get_segwit_address().to_string()
        )

    @staticmethod
    def get_coin_id():
        return Derivation.Bitcoin.value
