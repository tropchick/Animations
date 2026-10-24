#!/bin/sh
# Renders a composition in chunks (each kept on disk, so a stopped render resumes), then joins them with the audio.
# Usage: tools/render-chunks.sh SlimeEp1 public/audio/slime-ep1.wav out/slime-ep1.mp4 2561
set -e
id=$1; audio=$2; out=$3; total=$4; size=${5:-500}
dir=out/chunks-$id
mkdir -p "$dir"
: > "$dir/list.txt"
start=0
while [ $start -lt $total ]; do
  end=$((start + size - 1)); [ $end -ge $total ] && end=$((total - 1))
  f="$dir/part-$(printf %05d $start).mp4"
  if [ ! -f "$f" ]; then
    npx remotion render "$id" "$f.tmp.mp4" --frames=$start-$end --muted --concurrency=4 --crf=18 --gl=swangle --log=error
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "$dir/list.txt"
  start=$((end + 1))
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$dir/list.txt" -i "$audio" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$out"
echo "wrote $out"
