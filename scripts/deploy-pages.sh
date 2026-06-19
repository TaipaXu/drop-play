#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${REMOTE:-origin}"
SOURCE_BRANCH="${SOURCE_BRANCH:-master}"
PAGES_BRANCH="${PAGES_BRANCH:-gh-pages}"
SITE_URL="${SITE_URL:-https://taipaxu.github.io/drop-play/}"
TMPDIR="$(mktemp -d)"

cleanup() {
    if [[ -e "$TMPDIR/.git" ]]; then
        git -C "$ROOT" worktree remove "$TMPDIR" --force >/dev/null 2>&1 || true
    else
        rm -rf "$TMPDIR"
    fi
}
trap cleanup EXIT

cd "$ROOT"

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$SOURCE_BRANCH" ]]; then
    echo "Must deploy from $SOURCE_BRANCH. Current branch: $current_branch"
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree has uncommitted changes. Commit or stash them first."
    exit 1
fi

git fetch "$REMOTE" --prune

local_head="$(git rev-parse "$SOURCE_BRANCH")"
remote_head="$(git rev-parse "$REMOTE/$SOURCE_BRANCH")"
if [[ "$local_head" != "$remote_head" ]]; then
    echo "Local $SOURCE_BRANCH is not equal to $REMOTE/$SOURCE_BRANCH."
    echo "Pull or push your source branch before deploying."
    exit 1
fi

vp run build

if [[ ! -f "$ROOT/dist/drop-play.html" ]]; then
    echo "Build artifact not found: dist/drop-play.html"
    exit 1
fi

if git show-ref --verify --quiet "refs/remotes/$REMOTE/$PAGES_BRANCH"; then
    if git show-ref --verify --quiet "refs/heads/$PAGES_BRANCH"; then
        git worktree add "$TMPDIR" "$PAGES_BRANCH"
    else
        git worktree add -b "$PAGES_BRANCH" "$TMPDIR" "$REMOTE/$PAGES_BRANCH"
    fi
    git -C "$TMPDIR" pull --ff-only "$REMOTE" "$PAGES_BRANCH"
else
    git worktree add --detach "$TMPDIR" "$SOURCE_BRANCH"
    git -C "$TMPDIR" switch --orphan "$PAGES_BRANCH"
    git -C "$TMPDIR" rm -rf . >/dev/null 2>&1 || true
fi

install -m 0644 "$ROOT/dist/drop-play.html" "$TMPDIR/index.html"
touch "$TMPDIR/.nojekyll"

git -C "$TMPDIR" add index.html .nojekyll

if git -C "$TMPDIR" diff --cached --quiet; then
    echo "No changes to deploy."
    exit 0
fi

git -C "$TMPDIR" commit -m "Deploy GitHub Pages"
git -C "$TMPDIR" push "$REMOTE" "$PAGES_BRANCH"

echo "Deployed: $SITE_URL"
