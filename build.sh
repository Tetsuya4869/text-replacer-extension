#!/bin/bash
# Chrome Web Store 用 ZIP ファイルを作成

set -e

VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
FILENAME="text-replacer-v${VERSION}.zip"

rm -f "$FILENAME"

zip -r "$FILENAME" \
  manifest.json \
  background.js \
  content.js \
  utils.js \
  popup/ \
  options/ \
  icons/ \
  -x "*.DS_Store"

echo "Created $FILENAME"
ls -lh "$FILENAME"
