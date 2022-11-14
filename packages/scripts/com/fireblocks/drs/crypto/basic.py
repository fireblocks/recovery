DERIVATION_PURPOSE = 44


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

    def to_import_format(self) -> str:
        """
        This method is supposed to be implemented per class, meaning per recovery class.
        Given an ECDSA key, return a format of the key that will allow the user to import the private key to a different wallet.
        :return:
        """
        raise NotImplementedError("Not implemented on base class")

    @staticmethod
    def public_key_verification(extended_pub: str,
                                account: int = 0,
                                change: int = 0,
                                address_index: int = 0,
                                testnet: bool = False) -> (str, str):
        """
        Given an extended public key and information for the derivation path, compute the specific recovery's public
        key and address.
        :return: a tuple of strings, the first item is the public key, the second is the address.
        """
        raise NotImplementedError("Not implemented on base class")
