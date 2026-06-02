#!/usr/bin/env bash
# Runs formatting and linting in fix mode.
# Call this before committing to ensure code is clean.

set -e

npm run format
npm run lint:js:fix
npm run lint:scss
