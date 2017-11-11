#!/usr/bin/env bash

export BABEL_ENV=test
export NODE_ENV=test

./node_modules/.bin/nyc --reporter=lcov --reporter=text ./node_modules/.bin/mocha --opts .mocharc
