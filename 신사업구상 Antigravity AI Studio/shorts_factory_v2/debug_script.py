import os
import sys

# Append the current directory so we can import from server
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import run_script_yield, BASE_DIR

print("Testing run_script_yield manually...")
generator = run_script_yield(os.path.join(BASE_DIR, "execution", "research_topic.py"), ["Touching", "business", "Cinematic", "short", "portrait"])

try:
    for chunk in generator:
        print(chunk, end="")
    print("Done testing run_script_yield!")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
