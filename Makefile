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

build:
	rm -r ${MAKEFILE_DIR}/dist/*
	pnpm run build

publish: build
	pnpm publish --access public
