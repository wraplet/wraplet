.ONESHELL:
.PHONY: $(MAKECMDGOALS)
SHELL = /bin/bash

MAKEFILE_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))

lint-fix:
	pnpm run lint:fix

lint:
	pnpm run lint

tests:
	pnpm run tests

tests-perf:
	pnpm run tests:perf

build:
	rm -r ${MAKEFILE_DIR}/dist/*
	pnpm run build

publish: required-TAG build
	pnpm publish --access public --tag "${TAG}"

required-%:
	@if [ "${${*}}" = "" ]; then
		echo "Variable $* is required";
		exit 1;
	fi