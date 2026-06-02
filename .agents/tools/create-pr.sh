#!/usr/bin/env bash
# Pushes the current branch and opens a pull request.
# The PR body is read from a markdown file to avoid shell quoting issues
# with multi-line content.
#
# Usage:
#   create-pr.sh <title> <path-to-body.md>

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: create-pr.sh <title> <path-to-body.md>"
  exit 1
fi

title="$1"
body_file="$2"

if [ ! -f "$body_file" ]; then
  echo "Body file not found: $body_file"
  exit 1
fi

git push -u origin HEAD
gh pr create --title "$title" --body-file "$body_file"
