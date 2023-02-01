#!/bin/bash

python3 -m PyInstaller \
  --osx-bundle-identifier com.fireblocks.recovery-utility-server \
  --osx-entitlements-file res/entitlements.plist \
  --codesign-identity "$CODESIGN_IDENTITY" \
  --onefile __main__.py
