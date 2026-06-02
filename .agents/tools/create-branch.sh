#!/usr/bin/env bash
# Creates and checks out a feature branch.
# Branch name is always prefixed with feature/.
#
# Usage:
#   create-branch.sh <feature-name>

set -e

if [ -z "$1" ]; then
  echo "Usage: create-branch.sh <feature-name>"
  exit 1
fi

git checkout -b "feature/$1"
