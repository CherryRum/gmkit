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

step "TS: install"
( cd ts && npm ci )

step "TS: type-check + test"
( cd ts && npm run type-check && npm test )

step "Java: full reactor test"
( cd java && mvn -B -ntp test )

step "Parity: Java interop"
( cd java && mvn -B -ntp -pl gmkit -Dtest=InteropComplianceTest test )

step "Parity: TS interop"
( cd ts && npx vitest run test/interop-compliance.test.ts )

step "TS: build"
( cd ts && npm run build )

printf '\n\033[1;32mAll checks passed.\033[0m\n'