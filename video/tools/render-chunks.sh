#!/bin/sh
# Renders a composition in chunks (each kept on disk, so a stopped render resumes), then joins them with the audio.
# Usage: tools/render-chunks.sh SlimeEp1 public/audio/slime-ep1.wav out/slime-ep1.mp4 2561
# SCALE=0.6666666666666666 renders at 2/3 size (720x1280 for a 1080x1920 composition).
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
    # a busy machine sometimes trips a timeout inside Remotion; try a chunk up to 3 times
    for try in 1 2 3; do
      if npx remotion render "$id" "$f.tmp.mp4" --frames=$start-$end ${SCALE:+--scale=$SCALE} --muted --concurrency=4 --crf=18 --gl=swangle --log=error --timeout=120000; then
        mv "$f.tmp.mp4" "$f"; break
      fi
      [ $try -eq 3 ] && exit 1
    done
  fi
  echo "file '$(basename "$f")'" >> "$dir/list.txt"
  start=$((end + 1))
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$dir/list.txt" -i "$audio" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$out"
echo "wrote $out"
