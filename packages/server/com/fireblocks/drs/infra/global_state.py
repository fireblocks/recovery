from threading import Lock

from com.fireblocks.drs.crypto.chains.BTC import BitcoinRecovery
from com.fireblocks.drs.crypto.chains.ETH import EthereumRecovery
from com.fireblocks.drs.crypto.chains.SOL import SolanaRecovery

data = {}
global_state_lock = Lock()

ASSET_TYPE = "type"
ASSET_HELPER = "helper"

XPRV = "xprv"
FPRV = "fprv"
XPUB = "xpub"
FPUB = "fpub"

ASSET_TYPE_ECDSA = 0
ASSET_TYPE_EDDSA = 1


def setup_global_state():
    """
    Sets up the global storage state for usage.
    :return:
    """
    # TODO: There's probably a better way to do this
    set_data("BTC", {ASSET_HELPER: BitcoinRecovery, ASSET_TYPE: ASSET_TYPE_ECDSA})
    set_data("ETH", {ASSET_HELPER: EthereumRecovery, ASSET_TYPE: ASSET_TYPE_ECDSA})
    set_data("SOL", {ASSET_HELPER: SolanaRecovery, ASSET_TYPE: ASSET_TYPE_EDDSA})


def set_data(key: str, val: any, overwrite: bool = False) -> bool | Exception:
    """
    Sets a value inside the data dict for global usage.
    :param key: the key to associate with this piece of data
    :param val: the value to set
    :param overwrite: should the value of the key be overwritten if already exists within global storage.
    :return: True if successful, Runtime error if unsuccessful.
    """
    ret = True

    if not global_state_lock.locked():
        global_state_lock.acquire()

    if key in data.keys() and not overwrite:
        ret = RuntimeError(
            f"Requested to set key {key}, which already exists in storage, but without overwriting."
        )
    else:
        data[key] = val

    if global_state_lock.locked():
        global_state_lock.release()

    return ret


def get_data(key: str) -> any:
    """
    Gets data from global storage associated with the given key.
    :param key: the key associated with the data
    :return: None if the key doesn't exist, or the data stored.
    """
    if not global_state_lock.locked():
        global_state_lock.acquire()

    if key in data.keys():
        val = data[key]
    else:
        val = None

    if global_state_lock.locked():
        global_state_lock.release()

    return val
