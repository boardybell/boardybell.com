#!/bin/sh
# scripts/codex-run.sh visuals/prompts/NN-slug.md  -> visuals/inbox/NN-slug/raw-*.png
set -u
CODEX=${CODEX:-/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex}
brief=$1; s=$(basename "$brief" .md); d="$PWD/visuals/inbox/$s"; mkdir -p "$d"
"$CODEX" exec -m "${CODEX_MODEL:-gpt-6-astra}" -c model_reasoning_effort="${CODEX_EFFORT:-max}" --skip-git-repo-check -s workspace-write -C "$d" -o "$d/_last.txt" "$(cat "$brief")" < /dev/null > "$d/_run.log" 2>&1
echo "$s exit=$? files=$(ls "$d" | grep -c raw)"
