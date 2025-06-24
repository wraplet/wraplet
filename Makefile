.ONESHELL:
.PHONY: $(MAKECMDGOALS)
SHELL = /bin/bash

lint-fix:
	yarn run lint:fix

lint:
	yarn run lint

tests:
	yarn run tests

build:
	yarn run build

publish: build
	npm publish --access public
