import dataclasses

from com.fireblocks.drs.crypto.tx import TxResponse, TxRequest

DERIVATION_PURPOSE = 44


@dataclasses.dataclass
class DerivationDetails:
    """
    The private key in Wallet Import Format
    """

    wif: str | None

    """
    The private key in hex
    """

    prv: str

    """
    The public key in hex
    """
    pub: str

    """
    The address (in case multiple possibilities, the common use should be provided
    """
    address: str

    """
    The derivation path used for the key
    """
    path: str


class BaseRecovery:
    """
    The basic recovery class, consider it an abstract class, or an interface.
    No initializers, or any such thing.
    """

    def to_address(self) -> str:
        """
        The purpose of this function is to adjust the address computation based off the coin, as different coins might
        have different derivations.
        :return: the function on implemented classes should return a string representing the address.
        """
        raise NotImplementedError("Not implemented on base class")

    def get_derivation_details(self, **kwargs) -> DerivationDetails:
        """
        This method will return all the derivation details.
        :return: The derivation details
        """
        raise NotImplementedError("Not implemented on base class")

    @staticmethod
    def public_key_verification(
        extended_pub: str,
        account: int = 0,
        change: int = 0,
        address_index: int = 0,
        testnet: bool = False,
        **kwargs
    ) -> (str, str):
        """
        Given an extended public key and information for the derivation path, compute the specific recovery's public
        key and address.
        :return: a tuple of strings, the first item is the public key, the second is the address.
        """
        raise NotImplementedError("Not implemented on base class")

    @staticmethod
    def get_coin_id():
        """
        :return: Returns the coin id element of the derivation path
        """
        raise NotImplementedError("Not implemented on base class")
