"""

Fireblocks Recovery Utility Server

Recovers xprv, fprv, xpub, fpub from Fireblocks.

"""

import json
import traceback
import argparse
from waitress import serve
from flask import Flask, request
from flask_cors import CORS
from com.fireblocks.drs.recovery.recover_keys import RecoveryException, recover


XPRV = "xprv"
FPRV = "fprv"
XPUB = "xpub"
FPUB = "fpub"


app = Flask(__name__)
CORS(app)


def get_parameter(k, default=None):
    param = request.args.get(k)
    if not param and default is None:
        raise Exception(f"No parameter named {k} in request")
    elif not param and default:
        return default
    return param


# ======================================= Recover keys API


@app.route("/recover-keys", methods=["POST"])
def recover_keys():
    recover_prv = get_parameter("recover-prv", "False") in ["True", "true"]
    data = request.json
    try:
        rsa_key_passphrase = (
            data["rsa-key-passphrase"] if "rsa-key-passphrase" in data.keys() else None
        )
        res = recover_keys_impl(
            data["zip"],
            data["passphrase"],
            data["rsa-key"],
            rsa_key_passphrase,
            recover_prv,
        )
    except KeyError as key_exception:
        res = app.response_class(
            response=json.dumps(
                {"reason": f"Missing value for key: {str(key_exception)}"}
            ),
            status=500,
        )
    except Exception as fallback_exception:
        res = app.response_class(
            response=json.dumps({"reason": str(fallback_exception)}), status=500
        )
    return res


def recover_keys_impl(
    zip_file: str,
    mobile_pass: str,
    zip_prv_key: str,
    zip_prv_key_pass: str,
    recover_prv: bool,
):
    """
    Retrieves XPRV, FPRV, XPUB, FPUB.
    :param zip_file: Base64 encoded string representation of the zip file.
    :param mobile_pass: Mobile passphrase string.
    :param zip_prv_key: Base64 encoded string representation of the RSA key file.
    :param zip_prv_key_pass: RSA key passphrase string.
    :param recover_prv: Recover the private key as well
    :return:
    """
    try:
        res = recover(zip_file, zip_prv_key, mobile_pass, zip_prv_key_pass)
        if not recover_prv:
            del res[XPRV]
            del res[FPRV]
        return res
    except RecoveryException as recovery_exception:
        raise recovery_exception
    except Exception as fallback_exception:
        traceback.print_exc()
        raise Exception(f"Internal error during recovery process: {fallback_exception}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Recovery Utility", description="Fireblocks workspace recovery utility"
    )
    parser.add_argument("-p", "--port", help="HTTP server port", type=int, default=5000)
    args = parser.parse_args()
    print(f"Server started on port {args.port}")
    serve(app, host="localhost", port=args.port)
