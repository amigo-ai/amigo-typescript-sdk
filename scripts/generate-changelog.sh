#!/usr/bin/env bash
# Generate changelog entries from git log between tags.
# Usage: ./scripts/generate-changelog.sh [--from TAG] [--to REF] [--version VERSION]
set -euo pipefail

FROM_TAG=""
TO_REF="HEAD"
VERSION="Unreleased"

while [[ $# -gt 0 ]]; do
  case $1 in
    --from) FROM_TAG="$2"; shift 2 ;;
    --to) TO_REF="$2"; shift 2 ;;
    --version) VERSION="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$FROM_TAG" ]; then
  FROM_TAG=$(git tag --sort=-v:refname | head -1 2>/dev/null || echo "")
  if [ -z "$FROM_TAG" ]; then
    FROM_TAG=$(git rev-list --max-parents=0 HEAD)
  fi
fi

REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|')
DATE=$(date +%Y-%m-%d)

echo "## [$VERSION] - $DATE"
echo ""

declare -A CATEGORY_TITLES=(
  [feat]="Features"
  [fix]="Bug Fixes"
  [perf]="Performance"
  [refactor]="Refactoring"
  [docs]="Documentation"
  [test]="Tests"
  [ci]="CI"
  [chore]="Chores"
)

CATEGORY_ORDER=(feat fix perf refactor docs test ci chore)

for prefix in "${CATEGORY_ORDER[@]}"; do
  title="${CATEGORY_TITLES[$prefix]}"
  commits=$(git log "$FROM_TAG".."$TO_REF" --oneline --format="%s" 2>/dev/null \
    | grep -E "^${prefix}(\(.*\))?:" \
    | sed -E "s/^${prefix}(\([^)]*\))?:[[:space:]]*//" \
    || true)

  if [ -n "$commits" ]; then
    echo "### $title"
    while IFS= read -r msg; do
      # Convert PR references to links
      if [[ -n "$REPO_URL" ]]; then
        msg=$(echo "$msg" | sed -E "s|#([0-9]+)|[#\1](${REPO_URL}/pull/\1)|g")
      fi
      echo "- $msg"
    done <<< "$commits"
    echo ""
  fi
done

# Uncategorized commits
other=$(git log "$FROM_TAG".."$TO_REF" --oneline --format="%s" 2>/dev/null \
  | grep -vE "^(feat|fix|perf|refactor|docs|test|ci|chore|build|style)(\(.*\))?:" \
  || true)

if [ -n "$other" ]; then
  echo "### Other"
  while IFS= read -r msg; do
    if [[ -n "$REPO_URL" ]]; then
      msg=$(echo "$msg" | sed -E "s|#([0-9]+)|[#\1](${REPO_URL}/pull/\1)|g")
    fi
    echo "- $msg"
  done <<< "$other"
  echo ""
fi
