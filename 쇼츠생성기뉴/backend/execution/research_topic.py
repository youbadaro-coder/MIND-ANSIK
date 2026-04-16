import os
import sys
import json
import random
from datetime import datetime
from dotenv import load_dotenv

# Force UTF-8 output to avoid cp949 encode errors on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add parent dir to path to find ai_router
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai_router import generate_with_fallback

load_dotenv()

CATEGORIES = ["Touching", "Provocative", "Knowledge", "Funny", "Calm", "Horror", "Motivation"]

def research_topic(category=None, user_topic=None, user_style=None, format_type='short', orientation='portrait'):
    selected_category = category if category and category.strip() else random.choice(CATEGORIES)
    selected_style = user_style if user_style and user_style.strip() else "Cinematic"
    topic_hint = user_topic if user_topic and user_topic.strip() else "Trending viral topics in Korea"

    print(f"[Nova] Category: {selected_category} | Style: {selected_style}", flush=True)
    print(f"[Nova] Topic: {topic_hint}", flush=True)

    duration = "50-55 seconds" if format_type == 'short' else "2-3 minutes"
    num_segments = 8 if format_type == 'short' else 15

    prompt = f"""
You are 'Nova', a world-class AI Content Director specialized in viral Korean YouTube Shorts.
Create a high-retention script for a {duration} YouTube Shorts video.

Category: {selected_category}
Visual Style: {selected_style}
Topic/Hint: {topic_hint}

[VIRIAL STRATEGY]
1. Hook (0-3s): Shocking claim or unanswerable question. Viewers CANNOT swipe away.
2. Body: Rapid-fire facts or emotional storytelling. Zero filler.
3. CTA: Mind-blowing punchline or question that drives comments.

[RULES]
- Language: Korean (MUST use polite formal tone ~습니다/해요체. ZERO informal speech)
- Keep each segment text SHORT (under 2 sentences) for on-screen captions

[JSON OUTPUT - return ONLY valid JSON, no markdown]
{{
    "topic": "Viral clickbait title in Korean",
    "narration_tone": "Intense/Mysterious/Warm",
    "voice_profile": "ko-KR-SunHiNeural",
    "bgm_style": "Dramatic Phonk/Cinematic Piano/Dark Synth",
    "segments": [
        {{
            "text": "Korean script line",
            "pexels_search": ["english keyword 1", "english keyword 2"]
        }}
    ],
    "description": "YouTube description with Korean hashtags"
}}

Generate exactly {num_segments} segments.
"""

    try:
        raw, model_used = generate_with_fallback(prompt, log_fn=lambda m: print(m, flush=True))
        
        # Clean JSON
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()
        
        data = json.loads(raw)
        data.update({
            "category": selected_category,
            "style": selected_style,
            "format": format_type,
            "orientation": orientation,
            "timestamp": datetime.now().isoformat(),
            "ai_model": model_used,
        })

        job_tmp = os.environ.get("JOB_TMP_DIR", ".tmp")
        os.makedirs(job_tmp, exist_ok=True)
        out_path = os.path.join(job_tmp, 'topic_data.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[Nova] Script written via [{model_used}] -> {out_path}", flush=True)
        return True

    except Exception as e:
        print(f"[Nova] FATAL: {e}", flush=True)
        return False

if __name__ == "__main__":
    args = (sys.argv[1:] + [None]*5)[:5]
    ok = research_topic(args[0], args[1], args[2], args[3] or 'short', args[4] or 'portrait')
    sys.exit(0 if ok else 1)
