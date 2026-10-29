#!/usr/bin/env bash
# Rebuilds the film's tool set in a fresh container: the four skill/tool repositories at the commits this film was
# made with, the earshot and cinetic Python environments, and the pinned Eclipse snapshot.
# In a Claude cloud session, attach each repository first (add_repo, read access), then run this script.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"

clone_at() { # owner/repo commit [sparse-path]
	local dir="/home/user/${1,,}"
	if [ ! -d "$dir/.git" ]; then
		if [ -n "${3:-}" ]; then
			GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 --filter=blob:none --sparse "https://github.com/$1" "$dir"
			git -C "$dir" sparse-checkout set "$3"
		else
			GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 "https://github.com/$1" "$dir"
		fi
	fi
	# A fetch by SHA needs the full 40-character id; a short one fails with "couldn't find remote ref".
	git -C "$dir" fetch -q --depth 1 origin "$2"
	git -C "$dir" checkout -q "$2"
	echo "$1 @ $(git -C "$dir" rev-parse --short=12 HEAD)"
}

clone_at Leonxlnx/earshot 591fa3e028032e6dce56620a20e932e35667e8d8
clone_at Leonxlnx/cinetic ecfa6605de1adb9345ce937724810dc32267d068
clone_at Leonxlnx/taste-skill 12af471f627f866411b4bd785b19646d3672784c
clone_at heygen-com/hyperframes 81959201f0acb2e265e4d8c30daa89ffc1c9607d skills

# earshot: the full install needs CPU torch (download.pytorch.org) and its models (huggingface.co). Without those hosts
# only the model-free commands work (measure, sfx, kit), which is enough to make the sound.
python3 -m venv /home/user/.venvs/earshot
E=/home/user/.venvs/earshot/bin
$E/pip install -q --upgrade pip
if $E/pip install -q torch --index-url https://download.pytorch.org/whl/cpu 2>/dev/null; then
	$E/pip install -q -e /home/user/leonxlnx/earshot
	echo "earshot: full install (listening needs huggingface.co for laion/larger_clap_general and MIT/ast-finetuned-audioset)"
else
	$E/pip install -q numpy scipy soundfile soxr librosa pyloudnorm scikit-learn pillow matplotlib
	$E/pip install -q --no-deps -e /home/user/leonxlnx/earshot
	echo "earshot: model-free install (download.pytorch.org unreachable)"
fi

python3 -m venv /home/user/.venvs/cinetic
/home/user/.venvs/cinetic/bin/pip install -q numpy scipy soundfile pyloudnorm opencv-python-headless librosa \
	fonttools brotli uharfbuzz pillow
echo "cinetic venv ready; export EARSHOT_PYTHON=/home/user/.venvs/earshot/bin/python"

"$here/scripts/fetch-eclipse.sh"
(cd "$here/storyboard/src" && npm install --silent)
echo "done"
