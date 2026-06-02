#!/usr/bin/env bash
# Stages specific files and creates a commit.
# Never stages everything — only the files explicitly listed.
#
# Usage:
#   commit.sh "commit message" path/to/file1 path/to/file2 ...

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: commit.sh <message> <file> [file ...]"
  exit 1
fi

message="$1"
shift

git add "$@"
git commit -m "$message"
