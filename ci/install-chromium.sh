#!/usr/bin/env bash
set -euo pipefail

# Optional trust bundle for managed build proxies; never disable TLS verification.
if [[ -r /run/secrets/kurio_ca_bundle ]]; then
  export CURL_CA_BUNDLE=/run/secrets/kurio_ca_bundle
fi

if [[ "$(dpkg --print-architecture)" != amd64 ]]; then
  echo 'The pinned visual validation image requires linux/amd64.' >&2
  exit 1
fi

chromium_manifest="$(dirname "$0")/chromium.sha256"
chromium_package_dir="$(mktemp -d /tmp/kurio-chromium.XXXXXX)"
trap 'rm -rf -- "$chromium_package_dir"' EXIT
chmod 0755 "$chromium_package_dir"

# Keep the original signed-distribution binaries when the rolling APT index moves on.
chromium_pool='https://deb.debian.org/debian-security/pool/updates/main/c/chromium'
chromium_snapshot='https://snapshot.debian.org/archive/debian-security/20261014T000000Z/pool/updates/main/c/chromium'

while read -r chromium_expected_sha chromium_filename; do
  [[ -n "$chromium_expected_sha" ]] || continue
  chromium_destination="$chromium_package_dir/$chromium_filename"
  if ! curl --fail --silent --show-error --location --retry 2 --connect-timeout 20 --max-time 180 \
    --proto '=https' --proto-redir '=https' \
    --output "$chromium_destination" "$chromium_pool/$chromium_filename"; then
    curl --fail --silent --show-error --location --retry 2 --connect-timeout 20 --max-time 180 \
      --proto '=https' --proto-redir '=https' \
      --output "$chromium_destination" "$chromium_snapshot/$chromium_filename"
  fi
  # A checksum mismatch is fatal; never accept a different browser or checksum.
  printf '%s  %s\n' "$chromium_expected_sha" "$chromium_destination" | sha256sum --check --strict -
done < "$chromium_manifest"

apt-get install -y --no-install-recommends "$chromium_package_dir/"*.deb
chromium_installed_version="$(dpkg-query -W -f='${Version}' chromium)"
[[ "$chromium_installed_version" == '155.0.8059.39-1~deb13u1' ]]
chromium --version
