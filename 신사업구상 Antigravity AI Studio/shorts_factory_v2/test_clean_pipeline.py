import asyncio
import os
import sys
import json
import time
import shutil

test_dir = os.path.abspath(".tmp/test_clean")
os.environ["JOB_TMP_DIR"] = test_dir

# Setup absolute path imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from execution.research_topic import research_topic
from execution.fetch_materials import fetch_materials
from execution.edit_video import edit_video

async def run_clean():
    print("=== CLEAN TEST START ===")
    test_dir = os.path.abspath(".tmp/test_clean")
    
    # Wipe old test directory if exists
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir, exist_ok=True)
    os.makedirs(os.path.join(test_dir, "audio"), exist_ok=True)
    
    os.environ["JOB_TMP_DIR"] = test_dir
    print(f"Working in: {test_dir}")

    # 1. Research Topic (Manual Topic write so we don't call API for speed)
    print("-> Creating mock topic data with 2 short segments...")
    mock_data = {
      "format": "short",
      "orientation": "portrait",
      "voice_profile": "ko-KR-SunHiNeural",
      "segments": [
        {
          "i": 0,
          "text": "안녕하세요. 이건 첫 번째 숏폼 테스트 대본입니다.",
          "visual": "modern city street landscape",
          "keywords_en": "modern city street traffic neon portrait"
        },
        {
          "i": 1,
          "text": "두 번째 대령합니다. 이제 곧 렌더링이 시작될 겁니다.",
          "visual": "happy office crowd cheering",
          "keywords_en": "crowd cheering applause office workspace portrait"
        }
      ]
    }
    
    with open(os.path.join(test_dir, "topic_data.json"), "w", encoding="utf-8") as f:
         json.dump(mock_data, f, ensure_ascii=False, indent=2)

    # 2. Fetch Materials
    print("\n-> STEP 2: Fetching Materials...")
    fetch_materials() # Run fetch_materials
    
    # 3. Render Video
    print("\n-> STEP 3: Rendering Video with CustomLogger...")
    start_time = time.time()
    await edit_video() # Run edit_video
    end_time = time.time()
    
    print(f"\n=== CLEAN TEST END: {end_time - start_time:.2f} seconds ===")
    
    video_path = os.path.join(test_dir, "final_video.mp4")
    if os.path.exists(video_path):
         print(f"SUCCESS! Rendered file found. Size: {os.path.getsize(video_path)} bytes")
    else:
         print("FAILURE! No rendered file found.")

if __name__ == "__main__":
    asyncio.run(run_clean())
