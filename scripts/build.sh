#!/bin/sh

# 1. Copy this file to `build.local.sh` which will be ignored by Git.
# 2. Uncomment the below lines in the duplicated file.
# 3. Set your Apple Developer credentials for code signing and notarization.

# APPLE_API_KEY_ID="0000000000" \
#   APPLE_API_KEY="private_keys/AuthKey_0000000000.p8" \
#   APPLE_API_KEY_ISSUER="00000000-0000-0000-0000-000000000000" \
#   CODESIGN_IDENTITY="0000000000000000000000000000000000000000" \
  npx turbo run build
