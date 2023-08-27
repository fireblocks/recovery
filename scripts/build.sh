#!/bin/sh

# build.sh
# Runs the production build pipeline.
#
# 1. Copy this file to `build.local.sh` which will be ignored by Git.
# 2. Uncomment the below lines in `build.local.sh`.
# 3. Set your Apple Developer credentials for code signing and notarization.
#
# Alternatively you can set these environment variables in your shell
# profile as we do in the CI pipeline.
#
# https://www.electron.build/code-signing.html
# https://github.com/karaggeorge/electron-builder-notarize#using-notarytool
# ---------------------------------------------------------------------------

# APPLE_API_KEY_ID="0000000000" \
#   APPLE_API_KEY="private_keys/AuthKey_0000000000.p8" \
#   APPLE_API_KEY_ISSUER="00000000-0000-0000-0000-000000000000" \
export CSC_IDENTITY_AUTO_DISCOVERY=false
yarn turbo run build
