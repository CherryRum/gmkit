#!/usr/bin/env bash
set -euo pipefail

required=(
  DOCS_SOURCE_DIR
  DOCS_REMOTE_DIR
  DEPLOY_COMMIT
  SSH_PRIVATE_KEY
  SSH_REMOTE_USER
  SSH_REMOTE_HOST
  SSH_HOST_FINGERPRINT
)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
done

if [[ ! -s "$DOCS_SOURCE_DIR/index.html" || ! -s "$DOCS_SOURCE_DIR/deployment.json" ]]; then
  echo "Documentation artifact is incomplete: $DOCS_SOURCE_DIR" >&2
  exit 1
fi
if [[ "$DOCS_REMOTE_DIR" != /home/*/www/ ]]; then
  echo "Refusing unexpected remote directory: $DOCS_REMOTE_DIR" >&2
  exit 1
fi

temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
key_file="$temporary/id_key"
scan_file="$temporary/host.scan"
known_hosts="$temporary/known_hosts"
printf '%s\n' "$SSH_PRIVATE_KEY" > "$key_file"
chmod 600 "$key_file"

ssh-keyscan -T 15 "$SSH_REMOTE_HOST" > "$scan_file" 2>/dev/null
while IFS= read -r host_key; do
  [[ -n "$host_key" ]] || continue
  printf '%s\n' "$host_key" > "$temporary/host.key"
  fingerprint=$(ssh-keygen -lf "$temporary/host.key" -E sha256 | awk '{print $2}')
  if [[ "$fingerprint" == "$SSH_HOST_FINGERPRINT" ]]; then
    printf '%s\n' "$host_key" >> "$known_hosts"
  fi
done < "$scan_file"

if [[ ! -s "$known_hosts" ]]; then
  echo "SSH host fingerprint mismatch for $SSH_REMOTE_HOST" >&2
  exit 1
fi

ssh_options=(-i "$key_file" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$known_hosts")
target="$SSH_REMOTE_USER@$SSH_REMOTE_HOST"
rsync -az --delay-updates --delete-delay \
  --exclude='/api/typescript/versions/***' \
  --exclude='/api/java/versions/***' \
  --exclude='/api/versions.json' \
  -e "ssh ${ssh_options[*]}" \
  "$DOCS_SOURCE_DIR/" "$target:$DOCS_REMOTE_DIR"

remote_root=${DOCS_REMOTE_DIR%/}
ssh "${ssh_options[@]}" "$target" \
  "test -s '$remote_root/index.html' &&
   test -s '$remote_root/api/typescript/latest/index.html' &&
   test -s '$remote_root/api/java/latest/index.html' &&
   test -s '$remote_root/deployment.json' &&
   grep -F '\"commit\": \"$DEPLOY_COMMIT\"' '$remote_root/deployment.json' >/dev/null"

echo "Verified documentation deployment on $SSH_REMOTE_HOST"
