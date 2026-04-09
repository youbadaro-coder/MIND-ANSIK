import os
import json
import random
import google.generativeai as genai
from dotenv import load_dotenv
import sys
from datetime import datetime

# Load environment variables
load_dotenv()

print("Environment loaded.", flush=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)

CATEGORIES = ["Touching", "Provocative", "Knowledge", "Funny", "Calm"]

def research_topic(category=None, user_topic=None, user_style=None, format_type='short', orientation='portrait'):
    """
    Selects a category and uses Gemini to generate a video topic and script.
    """
    selected_category = category if category else random.choice(CATEGORIES)
    selected_style = user_style if user_style else "Cinematic"
    
    print(f"Selected Category: {selected_category}", flush=True)
    print(f"Selected Style: {selected_style}", flush=True)
    
    topic_context = f"Topic hint: {user_topic}" if user_topic else "Auto-generate a creative viral topic."

    # Load History
    history_path = os.path.join('data', 'history.json')
    history_data = []
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r', encoding='utf-8') as f:
                history_data = json.load(f)
        except:
            history_data = []
    
    # Last 5 topics for context
    history_context = ", ".join([h.get('topic', '') for h in history_data[-5:]]) if history_data else "None yet."

    duration_prompt = "approximately **50-55 seconds**." if format_type == 'short' else "approximately **2-3 minutes**."
    num_segments = "8-10 fast segments (to fill ~50s)." if format_type == 'short' else "15-20 segments (to fill 2-3 minutes)."

    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are 'Annie', a provocative and genius Content Director.
    Your goal is to create a **VIRAL YOUTUBE VIDEO** that keeps viewers hooked for {duration_prompt}
    
    Category: "{selected_category}"
    Visual Style: "{selected_style}"
    Context: {topic_context}
    
    [SEARCH STRATEGY]
    - 구글 검색 결과를 활용할 때, 일반 뉴스 기사뿐만 아니라 **관련 공식 홈페이지, 전문 블로그(티스토리, 네이버 블로그 등), 유튜브 공개 정보** 등을 다각도로 종합 참조하여 가장 입체적이고 흥미로운 스크립트를 구성하세요.
    
    [STRATEGY: THE DOPAMINE HOOK]
    1. **The Hook (0-3s)**: Must be shocking, a weird question, or a bold statement.
    2. **The Body**: Fast-paced facts or storytelling. No fluff.
    3. **The Twist/CTA**: Leave them thinking.

    [STRICT CONTENT RULES]
    - **Tone**: Provocative, Emotional, or Mind-Blowing.
    - **Language**: Korean (Native, trendy). 필수 규칙: **반드시 시청자에게 정중한 존댓말(Polite/Formal Korean, ~습니다/해요체)을 사용하세요. 반말(Informal tone)은 단 한 문장도 절대 금지합니다.**
    - **Visuals**: 
        - If Style is "Stick Figure", use keywords like "minimalist stick figure illustration", "whiteboard design", "simple line art".
        - If Style is "Sketch", use "charcoal drawing", "pencil illustration", "artistic sketch background", "hand-drawn artistic subject". **NEVER use keywords like 'hand', 'pen', 'writing', or 'drawing action'. Focus only on the artistic result.**
        - If Style is "Anime", use "high quality anime style", "makoto shinkai aesthetic", "vibrant anime colors".
        - For others, use HIGHLY specific professional cinematography terms.

    - **History Context**: Use the following previous topics to ensure variety and avoid repetition:
    {history_context}

    Please generate a JSON object with:
    - "topic": A clickbait-style title (Korean).
    - "narration_tone": "Fast & Intense" or "Deep & Mysterious".
    - "voice_profile": "ko-KR-SunHiNeural" (Femme Fatale) or "ko-KR-InJoonNeural".
    - "bgm_style": "Phaking Phonk", "Dark Synth", or "Emotional Piano".
    - "segments": {num_segments} Each has:
        - "text": Narration (Short, punchy Korean sentences).
        - "pexels_search": [Mandatory] 2-3 highly descriptive English keywords depicting the visual scene, NOT abstract names (e.g., "crowd cheering", "police strobe lights", "city streets Korea", NOT "BTS").
    - "description": Viral description with hashtags.

    Output ONLY raw JSON.
    """

    formatted_prompt = prompt.format(history_context=history_context)

    try:
        response = model.generate_content(formatted_prompt)
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text_response)
        
        data['category'] = selected_category
        data['style'] = selected_style
        data['format'] = format_type
        data['orientation'] = orientation
        data['timestamp'] = datetime.now().isoformat()
        
        # Save to .tmp for current run
        job_tmp = os.environ.get("JOB_TMP_DIR")
        if job_tmp:
            output_dir = job_tmp
        else:
            output_dir = os.path.join('.tmp')
            os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(output_dir, 'topic_data.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        # Append to History
        os.makedirs('data', exist_ok=True) # Ensure data directory exists
        history_data.append({
            "topic": data.get('topic'),
            "category": selected_category,
            "style": selected_style,
            "timestamp": data['timestamp']
        })
        # Keep last 50 entries
        with open(history_path, 'w', encoding='utf-8') as f:
            json.dump(history_data[-50:], f, ensure_ascii=False, indent=2)

        print(f"Successfully generated topic data and updated history.", flush=True)
        return data

    except Exception as e:
        print(f"Error generating topic: {e}")
        return None

if __name__ == "__main__":
    arg_category = sys.argv[1] if len(sys.argv) > 1 else None
    arg_topic = sys.argv[2] if len(sys.argv) > 2 else None
    arg_style = sys.argv[3] if len(sys.argv) > 3 else "Cinematic"
    arg_format = sys.argv[4] if len(sys.argv) > 4 else "short"
    arg_orientation = sys.argv[5] if len(sys.argv) > 5 else "portrait"
    
    res = research_topic(arg_category, arg_topic, arg_style, arg_format, arg_orientation)
    if res is None:
        print("Pipeline failed at Research topic.", flush=True)
        sys.exit(1)
    sys.exit(0)
