#!/usr/bin/env bash
# Extracts the Eclipse Owner concept, pinned at the commit the user accepted, into vendor/eclipse.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
commit="fedbdb6d"
src="design-research/owner-composition-exploration-r04/directions/eclipse"
root="$(git -C "$here" rev-parse --show-toplevel)"
git -C "$root" fetch -q origin owner-followup-r04-build
rm -rf "$here/vendor/eclipse" && mkdir -p "$here/vendor"
git -C "$root" archive "$commit" "$src" | tar -x -C "$here/vendor"
mv "$here/vendor/$src" "$here/vendor/eclipse" && rm -rf "$here/vendor/design-research"
echo "vendor/eclipse <- $commit:$src"
