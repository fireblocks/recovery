from com.fireblocks.drs.crypto.basic import DerivationDetails
from com.fireblocks.drs.crypto.derivation import Derivation
from com.fireblocks.drs.crypto.eddsa_basic import EdDSARecovery
from com.fireblocks.drs.crypto.eddsa_sign import eddsa_derive
from com.fireblocks.drs.infra.dynamic_loader import get_dep

PrivateKey = get_dep("eth_keys.datatypes").PrivateKey
base58 = get_dep("base58")


class SolanaRecovery(EdDSARecovery):
    def __init__(self,
                 fprv: str,
                 account: int = 0,
                 change: int = 0,
                 address_index: int = 0):
        super().__init__(fprv=fprv, coin_type=Derivation.Solana, account=account, change=change,
                         address_index=address_index)

    def to_address(self):
        return base58.b58encode(bytes.fromhex(self.pub_hex)).decode('utf-8')

    def get_derivation_details(self, **kwargs) -> DerivationDetails:
        return DerivationDetails(self.prv_hex, self.pub_hex, str(self.to_address()),
                                 f"44,{self.coin_id},{self.account},{self.change},{self.address_index}")

    @staticmethod
    def public_key_verification(extended_pub: str,
                                account: int = 0,
                                change: int = 0,
                                address_index: int = 0,
                                **kwargs) -> (str, str):
        testnet = kwargs.get("testnet", False)
        _, pub = eddsa_derive(extended_pub,
                              f"44/{Derivation.Solana.value if not testnet else Derivation.Testnet.value}/{account}/{change}/{address_index}")
        return pub.hex(), base58.b58encode(pub).decode('utf-8')

    @staticmethod
    def get_coin_id():
        return Derivation.Solana.value
