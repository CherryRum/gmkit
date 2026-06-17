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
	npm ci

test-ts: install-ts
	npm run test:ts

test-java:
	npm run test:java

parity:
	npm run parity

build-ts: install-ts
	npm run build:ts

build-java:
	npm run build:java

verify: test-ts test-java parity build-ts

clean:
	rm -rf packages/ts/dist node_modules packages/*/node_modules apps/*/node_modules
	mvn -f packages/java/pom.xml -B -ntp -q clean
