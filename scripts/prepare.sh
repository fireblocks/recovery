#!/bin/sh

python -m pip install --upgrade pip
python -m pip install -r packages/extended-key-recovery/requirements.txt
python -m pip install -r packages/extended-key-recovery/res/requirements.txt
npx is-ci || npx husky install
