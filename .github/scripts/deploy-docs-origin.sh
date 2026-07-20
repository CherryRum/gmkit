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

deploy_mode=${DOCS_DEPLOY_MODE:-site}
site_root=/home/gmkit-site/www
rsync_options=(-az --delay-updates)

case "$deploy_mode" in
  site)
    if [[ ! -s "$DOCS_SOURCE_DIR/index.html" || ! -s "$DOCS_SOURCE_DIR/deployment.json" ]]; then
      echo "Documentation artifact is incomplete: $DOCS_SOURCE_DIR" >&2
      exit 1
    fi
    expected_remote="$site_root/"
    rsync_options+=(
      --delete-delay
      '--exclude=/api/typescript/versions/***'
      '--exclude=/api/java/versions/***'
      '--exclude=/api/versions.json'
    )
    ;;
  api-latest)
    if [[ "${API_LANGUAGE:-}" != "typescript" && "${API_LANGUAGE:-}" != "java" ]]; then
      echo "API_LANGUAGE must be typescript or java" >&2
      exit 1
    fi
    [[ -s "$DOCS_SOURCE_DIR/index.html" ]] || {
      echo "API artifact is missing index.html: $DOCS_SOURCE_DIR" >&2
      exit 1
    }
    expected_remote="$site_root/api/$API_LANGUAGE/latest/"
    rsync_options+=(--delete-delay)
    ;;
  api-snapshot)
    if [[ "${API_LANGUAGE:-}" != "typescript" && "${API_LANGUAGE:-}" != "java" ]]; then
      echo "API_LANGUAGE must be typescript or java" >&2
      exit 1
    fi
    if [[ ! "${API_VERSION:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "API_VERSION must be a stable semantic version" >&2
      exit 1
    fi
    [[ -s "$DOCS_SOURCE_DIR/index.html" ]] || {
      echo "API artifact is missing index.html: $DOCS_SOURCE_DIR" >&2
      exit 1
    }
    expected_remote="$site_root/api/$API_LANGUAGE/versions/$API_VERSION/"
    rsync_options+=(--delete-delay)
    ;;
  api-manifest)
    [[ -s "$DOCS_SOURCE_DIR/versions.json" ]] || {
      echo "API manifest artifact is missing versions.json: $DOCS_SOURCE_DIR" >&2
      exit 1
    }
    expected_remote="$site_root/api/"
    ;;
  *)
    echo "Unsupported DOCS_DEPLOY_MODE: $deploy_mode" >&2
    exit 1
    ;;
esac

if [[ "$DOCS_REMOTE_DIR" != "$expected_remote" ]]; then
  echo "Refusing unexpected remote directory for $deploy_mode: $DOCS_REMOTE_DIR" >&2
  exit 1
fi

temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
key_file="$temporary/id_key"
scan_file="$temporary/host.scan"
known_hosts="$temporary/known_hosts"
observed_fingerprints="$temporary/observed-fingerprints"
touch "$observed_fingerprints"
printf '%s\n' "$SSH_PRIVATE_KEY" > "$key_file"
chmod 600 "$key_file"

ssh-keyscan -T 15 "$SSH_REMOTE_HOST" > "$scan_file" 2>/dev/null
while IFS= read -r host_key; do
  [[ -n "$host_key" ]] || continue
  printf '%s\n' "$host_key" > "$temporary/host.key"
  fingerprint_info=$(ssh-keygen -lf "$temporary/host.key" -E sha256)
  fingerprint=$(awk '{print $2}' <<< "$fingerprint_info")
  awk '{print $2 " " $NF}' <<< "$fingerprint_info" >> "$observed_fingerprints"
  if [[ "$fingerprint" == "$SSH_HOST_FINGERPRINT" ]]; then
    printf '%s\n' "$host_key" >> "$known_hosts"
  fi
done < "$scan_file"

if [[ ! -s "$known_hosts" ]]; then
  echo "SSH host fingerprint mismatch for $SSH_REMOTE_HOST" >&2
  echo "Observed SSH host fingerprints:" >&2
  sort -u "$observed_fingerprints" >&2
  exit 1
fi

ssh_options=(-i "$key_file" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$known_hosts")
target="$SSH_REMOTE_USER@$SSH_REMOTE_HOST"

if [[ "$deploy_mode" == "api-manifest" ]]; then
  while IFS=$'\t' read -r language version; do
    [[ "$language" =~ ^(typescript|java)$ && "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
      echo "Invalid entry in versions.json: $language $version" >&2
      exit 1
    }
    ssh "${ssh_options[@]}" "$target" \
      "test -s '$site_root/api/$language/versions/$version/index.html'"
  done < <(
    node -e '
      const fs = require("node:fs");
      const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      for (const entry of manifest.packages ?? []) {
        for (const version of entry.versions ?? []) console.log(`${entry.id}\t${version.version}`);
      }
    ' "$DOCS_SOURCE_DIR/versions.json"
  )
fi

rsync "${rsync_options[@]}" \
  -e "ssh ${ssh_options[*]}" \
  "$DOCS_SOURCE_DIR/" "$target:$DOCS_REMOTE_DIR"

remote_root=${DOCS_REMOTE_DIR%/}
case "$deploy_mode" in
  site)
    ssh "${ssh_options[@]}" "$target" \
      "test -s '$remote_root/index.html' &&
       test -s '$remote_root/api/typescript/latest/index.html' &&
       test -s '$remote_root/api/java/latest/index.html' &&
       test -s '$remote_root/deployment.json' &&
       grep -F '\"commit\": \"$DEPLOY_COMMIT\"' '$remote_root/deployment.json' >/dev/null"
    ;;
  api-latest|api-snapshot)
    ssh "${ssh_options[@]}" "$target" "test -s '$remote_root/index.html'"
    ;;
  api-manifest)
    local_hash=$(sha256sum "$DOCS_SOURCE_DIR/versions.json" | awk '{print $1}')
    remote_hash=$(ssh "${ssh_options[@]}" "$target" "sha256sum '$remote_root/versions.json'" | awk '{print $1}')
    [[ "$local_hash" == "$remote_hash" ]] || {
      echo "API version manifest checksum mismatch on $SSH_REMOTE_HOST" >&2
      exit 1
    }
    ;;
esac

echo "Verified $deploy_mode deployment on $SSH_REMOTE_HOST"
