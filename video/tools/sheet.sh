#!/bin/sh
# Contact sheet of all jpgs in a folder, 4 per row: tools/sheet.sh DIR OUT.jpg
dir=$1; out=$2
ffmpeg -loglevel error -y -pattern_type glob -i "$dir/f*.jpg" -vf "scale=360:-1,tile=4x4:padding=4" -frames:v 1 "$out"
