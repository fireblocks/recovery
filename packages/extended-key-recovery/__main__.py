"""

Fireblocks Extended Key Recovery

Recover xprv/fprv/xpub/fpub from Fireblocks Recovery Kit.

"""

import argparse
import json
from com.fireblocks.drs.recovery.recover_keys import recover


XPRV = "xprv"
FPRV = "fprv"
XPUB = "xpub"
FPUB = "fpub"


def recover_keys(
    zip: str,
    mobile_passphrase: str,
    rsa_key: str,
    rsa_key_passphrase: str,
    recover_private_keys: bool,
):
    """
    Recovers xprv, fprv, xpub, fpub from Fireblocks Recovery Kit
    :param zip: Base64-encoded string representation of the Recovery Kit zip file
    :param mobile_passphrase: Owner's mobile app passphrase string
    :param rsa_key: Base64-encoded string representation of the RSA key PEM file
    :param rsa_key_passphrase: RSA key passphrase string
    :param recover_private_keys: Recover private keys flag (include xprv/fprv)
    :return:
    """
    res = recover(zip, rsa_key, mobile_passphrase, rsa_key_passphrase)
    if not recover_private_keys:
        del res[XPRV]
        del res[FPRV]
    return res


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(
            prog="recovery",
            description="Fireblocks Extended Key Recovery: recover xprv/fprv/xpub/fpub from Fireblocks Recovery Kit",
        )
        parser.add_argument(
            "-z",
            "--zip",
            help="Base64-encoded string representation of the Recovery Kit zip file",
            type=str,
            required=True,
        )
        parser.add_argument(
            "-mp",
            "--mobile-passphrase",
            help="Owner's mobile app passphrase",
            type=str,
            required=True,
        )
        parser.add_argument(
            "-rk",
            "--rsa-key",
            help="Base64-encoded string representation of the RSA key PEM file",
            type=str,
            required=True,
        )
        parser.add_argument(
            "-rp",
            "--rsa-key-passphrase",
            help="RSA key passphrase",
            type=str,
        )
        parser.add_argument(
            "-p",
            "--private",
            help="Recover private keys flag (include xprv/fprv if true)",
            type=bool,
            default=False,
        )
        args = parser.parse_args()
        keys = recover_keys(
            args.zip,
            args.mobile_passphrase,
            args.rsa_key,
            args.rsa_key_passphrase,
            args.private,
        )
        print(json.dumps(keys))
    except Exception as exception:
        raise SystemExit(exception) from exception
