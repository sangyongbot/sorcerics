#!/usr/bin/env bash
#
# Slice the source video into a WebP image sequence for scroll-scrubbed playback.
#
# The hero uses an image-sequence canvas scrub (the technique scoutmotors.com uses)
# instead of scrubbing a <video> element's currentTime, because seeking a video on
# scroll — especially in reverse — is janky across browsers. A pre-decoded, fully
# preloaded frame sequence drawn to <canvas> reverses perfectly smoothly.
#
# Source: assets/source.mp4 — 1280x720, 24fps, 10s.
# Output: frames/frame_0001.webp .. frame_0240.webp
#   - 240 frames (24fps, the full source rate): halves the per-frame step of the
#     scroll scrub so it stops smoothly instead of ticking (was 120 @ 12fps)
#   - 1152px wide: crisp on most screens, much lighter than native 1280
#   - WebP q74: ~1.3MB total vs ~6.6MB for the equivalent JPGs (~5x smaller)
#
# ffmpeg here has no libwebp encoder, so we extract PNG frames and convert with
# cwebp (brew install webp). Re-run from the repo root:  bash scripts/slice.sh
set -euo pipefail

SRC="assets/source.mp4"
OUT="frames"
SM="frames/sm"        # downscaled set for small screens (lighter download + decode memory)
TMP="$(mktemp -d)"
FPS=24
WIDTH=1152            # desktop set
SM_WIDTH=640          # small-screen set (main.js picks it when innerWidth*dpr < 900)
QUALITY=74

trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT" "$SM"
rm -f "$OUT"/frame_*.jpg "$OUT"/frame_*.webp "$SM"/frame_*.webp

# Desktop set (PNG intermediate -> cwebp, since this ffmpeg has no libwebp).
ffmpeg -y -loglevel error -i "$SRC" -vf "fps=${FPS},scale=${WIDTH}:-2" "$TMP/f_%04d.png"
enc() { if command -v cwebp >/dev/null 2>&1; then cwebp -quiet -q "$QUALITY" "$1" -o "$2"; else magick "$1" -quality "$QUALITY" "$2"; fi; }
i=0
for f in "$TMP"/f_*.png; do
  i=$((i + 1))
  enc "$f" "$OUT/frame_$(printf '%04d' "$i").webp"
done

# Small-screen set.
rm -f "$TMP"/s_*.png
ffmpeg -y -loglevel error -i "$SRC" -vf "fps=${FPS},scale=${SM_WIDTH}:-2" "$TMP/s_%04d.png"
i=0
for f in "$TMP"/s_*.png; do
  i=$((i + 1))
  enc "$f" "$SM/frame_$(printf '%04d' "$i").webp"
done

echo "Wrote $(ls "$OUT"/frame_*.webp | wc -l | tr -d ' ') desktop frames ($(du -shc "$OUT"/frame_*.webp | tail -1 | cut -f1)) + $(ls "$SM"/frame_*.webp | wc -l | tr -d ' ') small frames ($(du -shc "$SM"/frame_*.webp | tail -1 | cut -f1))"
