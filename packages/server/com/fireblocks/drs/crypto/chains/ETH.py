from eth_keys.datatypes import PrivateKey, PublicKey
from bip32 import BIP32
from com.fireblocks.drs.crypto.basic import DERIVATION_PURPOSE, DerivationDetails
from com.fireblocks.drs.crypto.derivation import Derivation
from com.fireblocks.drs.crypto.ecdsa_basic import EcDSARecovery


class EthereumRecovery(EcDSARecovery):
    def __init__(
        self, xprv: str, account: int = 0, change: int = 0, address_index: int = 0
    ):
        super().__init__(
            xprv=xprv,
            coin_type=Derivation.Ethereum,
            account=account,
            change=change,
            address_index=address_index,
        )

    def to_address(self, checksum=False) -> str:
        if not checksum:
            return PrivateKey(bytes.fromhex(self.prv_hex)).public_key.to_address()
        else:
            return PrivateKey(
                bytes.fromhex(self.prv_hex)
            ).public_key.to_checksum_address()

    def get_derivation_details(self, **kwargs) -> DerivationDetails:
        checksum = kwargs.get("checksum", True)
        return DerivationDetails(
            self.prv_hex,
            self.pub_hex,
            self.to_address(checksum),
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
        checksum = kwargs.get("checksum", True)
        testnet = kwargs.get("testnet", False)
        pub = BIP32.from_xpub(extended_pub).get_pubkey_from_path(
            [
                DERIVATION_PURPOSE,
                Derivation.Ethereum.value if not testnet else Derivation.Testnet.value,
                account,
                change,
                address_index,
            ]
        )
        pub_key = PublicKey.from_compressed_bytes(pub)
        return (
            pub.hex(),
            pub_key.to_address() if not checksum else pub_key.to_checksum_address(),
        )

    @staticmethod
    def get_coin_id():
        return Derivation.Ethereum.value
