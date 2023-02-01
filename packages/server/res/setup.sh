#!/bin/bash

python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller eth-utils eth-keys bitcoin-utils bip32 bip32utils pynacl flask jinja2 markupsafe waitress toolz coincurve
