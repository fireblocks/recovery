#!/bin/sh

python -m pip install --upgrade pip
python -m pip install -r packages/py-dec/requirements.txt
python -m pip install -r packages/py-dec/res/requirements.txt
npx is-ci || npx husky install
