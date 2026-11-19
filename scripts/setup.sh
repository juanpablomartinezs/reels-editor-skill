#!/usr/bin/env bash
# First run, from the creator's project folder (the one that will hold raw/ and edit/):
#   bash ~/.claude/skills/reels-editor/scripts/setup.sh
# Makes raw/ edit/ assets/, a Python environment in .venv with the transcription and vision tools, and the Remotion
# project in remotion/ (a copy of the skill's template). Safe to run again: it skips what is already there.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p raw edit assets

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1. $2"; exit 1; }; }
need ffmpeg "macOS: brew install ffmpeg · Linux: sudo apt install ffmpeg · Windows: winget install ffmpeg (or use WSL)"
need node "Install Node 20 or newer: https://nodejs.org"
need python3 "Install Python 3.10-3.12: https://www.python.org/downloads/"

# pinned: torch/torchaudio 2.8 still ship the forced aligner transcribe.py uses; OpenCV 5 dropped the face detector faces.py uses
PKGS=(faster-whisper==1.2.1 num2words==0.5.14 "opencv-python-headless>=4.9,<5" numpy torch==2.8.0 torchaudio==2.8.0)
if [ ! -x .venv/bin/python ]; then
  if command -v uv >/dev/null 2>&1; then uv venv .venv --python 3.12; else python3 -m venv .venv; fi
fi
if command -v uv >/dev/null 2>&1; then uv pip install --python .venv "${PKGS[@]}"; else .venv/bin/pip install -q "${PKGS[@]}"; fi

if [ ! -d remotion ]; then cp -R "$SKILL/template" remotion; fi
(cd remotion && npm install --no-audit --no-fund)

echo
echo "Ready. Python tools: .venv/bin/python · Remotion: remotion/ · put your edited cut in raw/<name>.mp4"
echo "First transcription downloads Whisper (~1.6 GB) and the word aligner (~1.2 GB) once."
