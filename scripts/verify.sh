#!/usr/bin/env bash
# GMKit polyglot monorepo — run full TS + Java + parity verification.
#
# Equivalent to `make verify`. Useful for environments without GNU make.
#
# Usage:  ./scripts/verify.sh

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

step() {
  printf '\n\033[1;36m==> %s\033[0m\n' "$1"
}

step "npm: install"
npm ci

step "TS: type-check + test"
npm run test:ts

step "Java: full reactor test"
npm run test:java

step "Parity: shared vectors"
npm run parity

step "TS: build"
npm run build:ts

printf '\n\033[1;32mAll checks passed.\033[0m\n'
