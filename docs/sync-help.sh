#!/usr/bin/env bash
# Sync docs/help/ from public/help/ (canonical source).
# Run after editing chapters or bumping the embedded help book.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/help/"
DST="$ROOT/docs/help/"

if [ ! -d "$SRC" ]; then
  echo "error: $SRC does not exist"
  exit 1
fi

mkdir -p "$DST"
rsync -a --delete \
  --exclude '.help-book-installed' \
  --exclude '.help-book-backup' \
  --exclude '.DS_Store' \
  "$SRC" "$DST"

echo "synced $SRC -> $DST"
