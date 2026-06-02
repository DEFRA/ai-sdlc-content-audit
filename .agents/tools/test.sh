#!/usr/bin/env bash
# Runs the test suite.
# With no arguments, runs the full suite including the frontend build step.
# With a path or pattern argument, runs only matching tests (skips the build step).
#
# Usage:
#   test.sh
#   test.sh src/server/features/my-feature

set -e

if [ -n "$1" ]; then
  npx vitest run "$@"
else
  npm test
fi
