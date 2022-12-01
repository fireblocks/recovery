import dataclasses
from dataclasses_json import dataclass_json


@dataclass_json
@dataclasses.dataclass
class TxRequest:
    """
    The address to which this transaction is meant
    """
    to: str

    """
    The amount for the transaction
    """
    amount: float

    """
    The ABI to use for contract calls
    """
    abi: dict

    """
    The contract call parameters to use when constructing the transaction
    """
    contract_call_params: dict

    """
    The fee parameters to use for the transaction creation (if relevant)
    """
    fee: dict

    """
    The memo or tag to add to the transaction
    """
    memo: str


@dataclasses.dataclass
class TxResponse:
    """
    A base64 encoded string representing a QR image
    """
    qr: str

    """
    The hex of the signed transaction
    """
    tx: str
