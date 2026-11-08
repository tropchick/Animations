#!/bin/sh
# Reproducible optional local Python environment; falls back to the normal interpreter.
set -e
if [ -x audio/.venv-three/bin/python ]; then
  exec audio/.venv-three/bin/python audio/make_three_audio.py
fi
exec python3 audio/make_three_audio.py
