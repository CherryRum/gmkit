# GMKit polyglot monorepo — top-level entry points.
#
# Usage:
#   make verify        # full TS + Java + parity verification
#   make test-ts       # only TS tests (vitest)
#   make test-java     # only Java tests (Maven surefire)
#   make parity        # only the cross-language interop suite
#   make build-ts      # build TS package (tsup)
#   make build-java    # mvn -DskipTests install
#   make clean         # remove build artifacts in both stacks

SHELL := /bin/bash
.PHONY: verify test-ts test-java parity build-ts build-java clean install-ts

install-ts:
	cd ts && npm ci

test-ts: install-ts
	cd ts && npm run type-check && npm test

test-java:
	cd java && mvn -B -ntp test

parity:
	cd java && mvn -B -ntp -pl gmkit -Dtest=InteropComplianceTest test
	cd ts && npx vitest run test/interop-compliance.test.ts

build-ts: install-ts
	cd ts && npm run build

build-java:
	cd java && mvn -B -ntp -DskipTests install

verify: test-ts test-java parity build-ts

clean:
	cd ts && rm -rf dist node_modules
	cd java && mvn -B -ntp -q clean