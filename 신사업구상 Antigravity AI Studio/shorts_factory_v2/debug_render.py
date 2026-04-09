import asyncio
import os
import sys
import json
import time

# Add execution directory to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'execution')))

from execution.edit_video import edit_video

async def test_render():
    print("=== DEBUG START ===")
    
    # Create dummy topic_data.json if needed, or find latest in .tmp
    tmp_dirs = [d for d in os.listdir('.tmp') if os.path.isdir(os.path.join('.tmp', d))]
    
    selected_dir = '.tmp'
    if tmp_dirs:
         # Use the first job dir found
         selected_dir = os.path.join('.tmp', tmp_dirs[0])
         print(f"Testing with directory: {selected_dir}")

    os.environ["JOB_TMP_DIR"] = selected_dir
    
    start = time.time()
    await edit_video()
    end = time.time()
    
    print(f"=== DEBUG END: {end - start:.2f} seconds ===")

if __name__ == "__main__":
    asyncio.run(test_render())
