#!/usr/bin/env bash
set -euo pipefail

EDITOR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="/Volumes/ykxDrive/work/work-temp/tj-no-luckysheet/packages/app-main/src/editor"

mkdir -p "${TARGET_DIR}"
echo "Cleaning output directory: ${TARGET_DIR}"
find "${TARGET_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

cd "${EDITOR_ROOT}"
echo "Typechecking..."
BUILD_TARGET=tj-no-luckysheet vue-tsc --noEmit

echo "Building (full, tj-no-luckysheet)..."
BUILD_TARGET=tj-no-luckysheet vite build --config vite.config.full.ts --outDir "${TARGET_DIR}"

echo "Done."
