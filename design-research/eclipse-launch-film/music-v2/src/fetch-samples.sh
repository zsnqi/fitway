#!/usr/bin/env bash
# Fetches the recorded instruments Drive v2 plays, exactly as pinned in vsco2ce.lock:
#   VSCO-2 Community Edition, CC0 1.0 Universal, commit 440300901dfe9275fd84e0b7763af1f8443ae62e
# into FILM/vendor/samples/vsco2ce/<path at that commit> (gitignored; never committed).
#
# Every file is downloaded from that full commit id (never a branch), then checked against its git blob hash in
# the lock with `git hash-object`; a mismatch deletes the file and fails. Files already present and matching are
# kept, so a second run downloads nothing. The downloads are data: nothing in them is executed, and the score code
# reads them with `python -I`.
#
# Usage: bash music-v2/src/fetch-samples.sh [--check]     (--check: verify what is there, download nothing)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILM="$(dirname "$(dirname "$HERE")")"
LOCK="$HERE/vsco2ce.lock"
REPO="sgossner/VSCO-2-CE"
SHA="440300901dfe9275fd84e0b7763af1f8443ae62e"
DEST="$FILM/vendor/samples/vsco2ce"
JOBS="${JOBS:-6}"
CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

grep -q "^# commit $SHA" "$LOCK" || { echo "fetch-samples: $LOCK does not pin $SHA" >&2; exit 1; }
mkdir -p "$DEST"

# one file: <blob sha> <path>; prints ok / got / FAIL lines, exit status 1 on failure
fetch_one() {
  local want="$1" path="$2" out url tmp
  out="$DEST/$path"
  if [ -f "$out" ] && [ "$(git hash-object "$out")" = "$want" ]; then
    echo "ok   $path"; return 0
  fi
  if [ "$CHECK" = 1 ]; then echo "FAIL missing or changed: $path" >&2; return 1; fi
  mkdir -p "$(dirname "$out")"
  # percent-encode the path for the URL: space, '#', '%', and anything outside the safe set
  url="https://raw.githubusercontent.com/$REPO/$SHA/$(printf '%s' "$path" | /usr/bin/env LC_ALL=C awk '
    BEGIN { for (i = 0; i < 256; i++) ord[sprintf("%c", i)] = i }
    { s = ""; for (i = 1; i <= length($0); i++) { c = substr($0, i, 1)
        if (c ~ /[A-Za-z0-9._~\/-]/) s = s c; else s = s sprintf("%%%02X", ord[c]) }
      printf "%s", s }')"
  tmp="$out.part.$$"
  if ! curl -sS --fail --retry 4 --retry-delay 2 --retry-all-errors -o "$tmp" "$url"; then
    rm -f "$tmp"; echo "FAIL download: $path" >&2; return 1
  fi
  if [ "$(git hash-object "$tmp")" != "$want" ]; then
    rm -f "$tmp"; echo "FAIL hash mismatch: $path" >&2; return 1
  fi
  mv -f "$tmp" "$out"
  echo "got  $path"
}
export -f fetch_one
export DEST REPO SHA CHECK

grep -v '^#' "$LOCK" | grep -v '^$' | while IFS= read -r line; do
  printf '%s\0%s\0' "${line%%  *}" "${line#*  }"
done | xargs -0 -n 2 -P "$JOBS" bash -c 'fetch_one "$1" "$2"' _ > "$DEST/.fetch.log" 2>&1 || {
  grep FAIL "$DEST/.fetch.log" >&2; echo "fetch-samples: failed (see $DEST/.fetch.log)" >&2; exit 1; }

n_ok=$(grep -c '^ok ' "$DEST/.fetch.log" || true)
n_got=$(grep -c '^got ' "$DEST/.fetch.log" || true)
n_all=$(grep -vc '^#' "$LOCK")
if [ $((n_ok + n_got)) -ne "$n_all" ]; then
  echo "fetch-samples: $((n_ok + n_got)) of $n_all files verified" >&2; exit 1
fi
head -1 "$DEST/LICENSE" | grep -q '^CC0 1.0 Universal' || { echo "fetch-samples: LICENSE is not CC0 1.0" >&2; exit 1; }
echo "fetch-samples: $n_all files verified at $SHA ($n_got downloaded, $n_ok already present) in $DEST"
