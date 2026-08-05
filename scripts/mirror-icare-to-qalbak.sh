#!/usr/bin/env bash
# Mirror mostafamahmoud40/ICARE-CVD -> mostafamahmoud40/qalbak-ai
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

GIT_HTTP="${GIT_HTTP:-HTTP/1.1}"

echo "==> Fetching icare (source) and qalbak (mirror)..."
git -c http.version="$GIT_HTTP" fetch icare --prune
git -c http.version="$GIT_HTTP" fetch qalbak --prune

echo "==> Pushing branches from ICARE-CVD to qalbak-ai..."
git -c http.version="$GIT_HTTP" push qalbak refs/remotes/icare/develop:refs/heads/develop
git -c http.version="$GIT_HTTP" push qalbak refs/remotes/icare/main:refs/heads/main

echo "==> Pushing tags (if any)..."
git -c http.version="$GIT_HTTP" push qalbak --tags

echo "==> Verifying mirror..."
git -c http.version="$GIT_HTTP" fetch icare --prune
git -c http.version="$GIT_HTTP" fetch qalbak --prune

develop_icare=$(git rev-parse icare/develop)
develop_qalbak=$(git rev-parse qalbak/develop)
main_icare=$(git rev-parse icare/main)
main_qalbak=$(git rev-parse qalbak/main)

echo "  develop: icare=$develop_icare  qalbak=$develop_qalbak"
echo "  main:    icare=$main_icare  qalbak=$main_qalbak"

if [[ "$develop_icare" == "$develop_qalbak" && "$main_icare" == "$main_qalbak" ]]; then
  echo "OK: qalbak-ai mirrors ICARE-CVD (develop + main)."
else
  echo "ERROR: branches still differ." >&2
  exit 1
fi
