"""Recovery Utility Server"""

import json
import traceback
import argparse
from pprint import pprint
from waitress import serve
from flask import Flask, request
from com.fireblocks.drs.crypto.basic import DerivationDetails
from com.fireblocks.drs.infra.global_state import (
    setup_global_state,
    get_data,
    ASSET_TYPE,
    ASSET_TYPE_ECDSA,
    ASSET_TYPE_EDDSA,
    ASSET_HELPER,
)


app = Flask(__name__)


def get_parameter(k, default=None):
    param = request.args.get(k)
    if not param and default is None:
        raise Exception(f"No parameter named {k} in request")
    elif not param and default:
        return default
    return param


# ======================================= Derive Keys API

@app.route("/derive-keys", methods=["GET"])
def derive_keys():
    try:
        res = derive_keys_impl()
    except Exception as e:
        traceback.print_exc()
        res = app.response_class(response=json.dumps({"reason": str(e)}), status=500)

    return res


def derive_keys_impl():
    asset = get_parameter("asset")
    account = int(get_parameter("account"))
    change = int(get_parameter("change"))
    index_start = int(get_parameter("index_start"))
    index_end = int(get_parameter("index_end"))
    use_xpub = get_parameter("xpub", "False") in ["True", "true"]
    legacy = get_parameter("legacy", "False") in ["True", "true"]
    checksum = get_parameter("checksum", "True") in ["True", "true"]
    testnet = get_parameter("testnet", "False") in ["True", "true"]

    if account < 0:
        raise Exception(f"Invalid account: {account}")
    if change < 0:
        raise Exception(f"Invalid change: {change}")
    if index_start < 0 or index_start > index_end:
        raise Exception(f"Invalid index range: {index_start} -> {index_end}")
    if index_end < 0:
        raise Exception(f"Invalid end index: {index_end}")

    # Obtain the asset information
    asset_info = get_data(asset)
    if asset_info is None:
        raise Exception(f"Unknown asset: {asset}")
    asset_type = asset_info[ASSET_TYPE]
    if asset_type == ASSET_TYPE_ECDSA:
        data_key = "xpub" if use_xpub else "xprv"
    elif asset_type == ASSET_TYPE_EDDSA:
        data_key = "fpub" if use_xpub else "fprv"
    else:
        raise KeyError(f"Unknown key type - {asset_type}.")

    key_to_use = get_data(data_key)
    if key_to_use is None:
        raise KeyError(f"Missing the {data_key} - make sure you finished setup")

    helper_class = asset_info[ASSET_HELPER]
    kwargs = {"legacy": legacy, "testnet": testnet, "checksum": checksum}
    res = []
    for index in range(index_start, index_end + 1):
        if use_xpub:
            pub_hex, address = helper_class.public_key_verification(
                key_to_use, account, change, index, **kwargs
            )
            res.append(
                DerivationDetails(
                    "",
                    pub_hex,
                    address,
                    f"44,{helper_class.get_coin_id() if not testnet else '1'},{account},{change},{index}",
                )
            )
        else:
            helper = helper_class(key_to_use, account, change, index)
            res.append(helper.get_derivation_details(**kwargs))

    pprint(res)
    return res


# ======================================= Recover keys API


@app.route("/recover-keys", methods=["POST"])
def recover_keys():
    data = request.form
    try:
        res = recover_keys_impl(
            data["zip"], data["passphrase"], data["rsa-key"], data["rsa-key-passphrase"]
        )
        return res
    except Exception as e:
        res = app.response_class(response=json.dumps({"reason": str(e)}), status=500)


def recover_keys_impl(
    zip_file: str, passphrase: str, rsa_key: str, rsa_key_passphrase: str
):
    """
    Retrieves XPRV, FPRV, XPUB, FPUB.
    :param zip_file: Base64 encoded string representation of the zip file.
    :param passphrase: Base64 encoded string representation of the passphrase.
    :param rsa_key: Base64 encoded string representation of the RSA key file.
    :param rsa_key_passphrase: Base64 encoded string representation of the RSA key passphrase.
    :return:
    """
    # TODO - copy existing recovery code from Github (Fireblocks Recovery) and use it in here.
    # TODO - use set_data to global state after recovering keys.
    return {"xprv": "", "fprv": "", "xpub": "", "fpub": ""}


# ======================================= Show Extended Private Keys API


@app.route("/show-extended-private-keys", methods=["GET"])
def show_extended_private_keys():
    try:
        res = show_extended_private_keys_impl()
    except Exception as e:
        res = app.response_class(response=json.dumps({"reason": str(e)}), status=500)

    return res


def show_extended_private_keys_impl():
    data_key = "xprv"
    xprv = get_data(data_key)

    data_key = "fprv"
    fprv = get_data(data_key)

    if xprv and fprv:
        return {"xprv": xprv, "fprv": fprv}

    raise Exception(
        f"No entry for either xprv or fprv. Make sure to recover the addresses first."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Recovery Utility", description="Fireblocks workspace recovery utility"
    )
    parser.add_argument("-p", "--port", help="HTTP server port", type=int, default=5000)
    parser.add_argument("-s", "--secret", type=str, help="JWT secret")
    parser.add_argument("-d", "--debug", help="debug mode", action="store_true")
    args = parser.parse_args()

    if args.secret:
        app.config["SECRET_KEY"] = args.secret

    setup_global_state()
    print("Server started")
    serve(app, host="localhost", port=args.port)
