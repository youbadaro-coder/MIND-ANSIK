import os
import sys
import json
import random
import requests
import shutil
import numpy as np
from dotenv import load_dotenv

# Force UTF-8 output to avoid cp949 encode errors on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

load_dotenv()

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# ──────────────────────────────────────────
# Pexels Fetcher
# ──────────────────────────────────────────

def fetch_pexels_video(query, orientation='portrait'):
    if not PEXELS_API_KEY:
        return None
    headers = {"Authorization": PEXELS_API_KEY}
    url = f"https://api.pexels.com/videos/search?query={query}&orientation={orientation}&per_page=5"
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        videos = data.get('videos', [])
        if not videos:
            return None
        for v in videos:
            files = v.get('video_files', [])
            for f in files:
                if f['file_type'] == 'video/mp4' and f.get('width', 0) <= 1080:
                    return f['link']
        return videos[0]['video_files'][0]['link']
    except Exception as e:
        print(f"Pexels fetch error: {e}")
        return None

def download_file(url, path):
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(path, 'wb') as f:
                shutil.copyfileobj(r.raw, f)
        return True
    except Exception as e:
        print(f"Download error: {e}")
        return False

# ──────────────────────────────────────────
# Fallback: Generate gradient video with moviepy
# ──────────────────────────────────────────

# Beautiful gradient color palettes for each category
PALETTES = [
    [(10, 10, 40), (60, 20, 120)],    # Deep purple
    [(5, 20, 60), (20, 80, 160)],     # Ocean blue
    [(40, 5, 5), (120, 30, 20)],      # Crimson
    [(5, 30, 20), (15, 100, 60)],     # Emerald
    [(30, 10, 50), (100, 20, 100)],   # Magenta
    [(10, 25, 50), (30, 70, 130)],    # Steel blue
    [(50, 20, 0), (130, 70, 10)],     # Amber
    [(5, 5, 30), (40, 10, 90)],       # Indigo
]

def generate_fallback_video(dest_path, index=0, orientation='portrait', duration=5.0):
    """Generate a high-end cinematic canvas as fallback."""
    try:
        from moviepy import VideoClip

        w, h = (1080, 1920) if orientation == 'portrait' else (1920, 1080)
        palette = PALETTES[index % len(PALETTES)]
        c1 = np.array(palette[0], dtype=np.float32)
        c2 = np.array(palette[1], dtype=np.float32)

        # Pre-compute base gradient
        base_gradient = np.zeros((h, w, 3), dtype=np.float32)
        for y in range(h):
            t = y / h
            base_gradient[y, :] = c1 * (1 - t) + c2 * t

        def make_frame(t):
            # Slow animated pulse effect + subtle noise
            pulse = 0.9 + 0.1 * np.sin(t * 0.8)
            noise = np.random.normal(0, 3, (h, w, 3)).astype(np.float32)
            frame = np.clip(base_gradient * pulse + noise, 0, 255).astype(np.uint8)
            return frame

        clip = VideoClip(make_frame, duration=duration)
        clip.write_videofile(
            dest_path, fps=12, codec="libx264", # Low FPS for fallback is fine and fast
            audio=False, preset="ultrafast",
            logger=None
        )
        return True
    except Exception as e:
        print(f"Fallback video generation error: {e}")
        return False

# ──────────────────────────────────────────
# Main
# ──────────────────────────────────────────

def main():
    job_tmp = os.environ.get("JOB_TMP_DIR", ".tmp")
    data_path = os.path.join(job_tmp, "topic_data.json")

    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    segments = data.get('segments', [])
    orientation = data.get('orientation', 'portrait')

    if not PEXELS_API_KEY:
        print("[WARNING] PEXELS_API_KEY is missing. Using Premium Motion Graphics fallbacks.")

    print(f"Collecting assets for {len(segments)} segments...")

    for i, seg in enumerate(segments):
        dest = os.path.join(job_tmp, f"segment_{i}.mp4")

        # Try Pexels first
        pexels_ok = False
        if PEXELS_API_KEY:
            queries = seg.get('pexels_search', ["nature cinematic"])
            if isinstance(queries, str):
                queries = [queries]
            
            # Add some variety to queries if first one fails
            queries.extend(["cinematic wallpaper", "abstract background"])

            for q in queries:
                print(f"Segment {i}: Fetching from Pexels '{q}'...")
                link = fetch_pexels_video(q, orientation)
                if link and download_file(link, dest):
                    pexels_ok = True
                    print(f"Segment {i}: Pexels OK")
                    break

        # Fallback: generate premium motion canvas
        if not pexels_ok:
            print(f"Segment {i}: Generating cinematic fallback canvas...")
            generate_fallback_video(dest, index=i, orientation=orientation, duration=10.0) # Longer for safety

    # BGM Fallback - silent mp3 (no BGM better than a broken URL)
    bgm_dest = os.path.join(job_tmp, "bgm.mp3")
    if not os.path.exists(bgm_dest):
        print("No BGM source. Skipping BGM.")

if __name__ == "__main__":
    main()
