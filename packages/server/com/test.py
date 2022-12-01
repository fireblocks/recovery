from com.fireblocks.drs.crypto.chains.BTC import BitcoinRecovery
from com.fireblocks.drs.crypto.chains.ETH import EthereumRecovery
from com.fireblocks.drs.crypto.chains.SOL import SolanaRecovery

if __name__ == "__main__":
    xprv = "xprv9s21ZrQH143K4ZtuNcBPjXZJJLCyA6xJ6ta3spD9e6LpuoqYxXyAetiHxdJ5DUoRHmek7iEZNaTTMR6MzGkH9znKrZa2Yo7paNWJ6HT3Dbp"
    fprv = "fprv4LsXPWzhTTp9cXduCWonC2wkNsjN9Z6pXyiJa716Byvs16zffMAc5pXwc67LvHVNK87L935jCCKUF7Yi7omAnZ1pQnLc4UqbdSE3EdPpSHy"
    xpub = "xpub661MyMwAqRbcGfa1fQr7JtdBaCgefFD1pdzt1xf56vqX1hWmgeMhvxqjTBkLySerERmLByXPTZoMMeDkWS2msCUg5zn4vYZHZ4ecjX5256L"
    fpub = "fpub8sZZXw2wbqVpVcGLGwc5ofj1fjtVQZpbTopKCP5hWkgy4gbWUK4UzaxmRQszuUwaxZWQ4j7FEwduyrhqMgZ5LVwUYmnbb6t6m3RkieV2WSV"

    btc = BitcoinRecovery(xprv)
    eth = EthereumRecovery(xprv)
    sol = SolanaRecovery(fprv)

    assert (
        BitcoinRecovery.public_key_verification(xpub)[1]
        == "bc1q726thgmav5e2k65qvf3xwvpmfxnfwem5zddx83"
    ), "Incorrect segwit BTC address"
    assert (
        BitcoinRecovery.public_key_verification(xpub, legacy=True)[1]
        == "1P8K2yE64aX2KsS24W6qh3PExk3m1QT66F"
    ), "Incorrect legacy BTC address"

    assert (
        EthereumRecovery.public_key_verification(xpub)[1]
        == "0x372a84b1c8d3ea3c74e4595262ee47ae568bed28"
    ), "Incorrect eth address"
    assert (
        EthereumRecovery.public_key_verification(xpub, testnet=True)[1]
        == "0xfa724a940c60bd715c0ca732bb8cbb719231e874"
    ), "Incorrect eth testnet address"
    assert (
        EthereumRecovery.public_key_verification(xpub, checksum=True)[1]
        == "0x372A84b1C8D3Ea3C74E4595262eE47aE568BEd28"
    ), "Incorrect eth checked address"
    assert (
        EthereumRecovery.public_key_verification(xpub, checksum=True, testnet=True)[1]
        == "0xfa724a940C60Bd715C0ca732bb8cBb719231E874"
    ), "Incorrect eth testnet checked address"
    assert (
        SolanaRecovery.public_key_verification(fpub)[1]
        == "5Z4uQw8PzqtmnH4gbyqiQVT1XsyFKjN7UTUKtvGvjLjj"
    ), "Incorrect SOL address"
    assert (
        SolanaRecovery.public_key_verification(fpub, testnet=True)[1]
        == "EgyRfRXXk62TkYaMFUAgmPVQU637AAAimY5etjBFQqtA"
    ), "Incorrect SOL testnet address"

    assert (
        btc.to_address() == "bc1qjhm0h7vhdyu0d0luv34dlz654rmsvg8twywk99"
    ), "Incorrect segwit BTC address"
    assert (
        btc.to_address(legacy=True) == "1EfwZMNJsvYDTMY42DaudMq95hWgfX6Zco"
    ), "Incorrect Legacy BTC address"
    assert (
        eth.to_address() == "0x289826f7248b698b2aef6596681ab0291bfb2599"
    ), "Incorrect eth address"
    assert (
        eth.to_address(checksum=True) == "0x289826f7248b698B2Aef6596681ab0291BFB2599"
    ), "Incorrect eth checked address"
    assert (
        sol.to_address() == "uXvR3Yu8A8Zc6RZdQNfE4kzLcbeNwa6neMYXjHN6Y8V"
    ), "Incorrect SOL address"
