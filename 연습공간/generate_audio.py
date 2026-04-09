import os
import sys
import io
from google import genai
from google.genai import types

# Windows 콘솔 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8', errors='replace')

# 1. API 클라이언트 연결
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("=" * 50)
print("  Google Lyria AI 음악 생성기")
print("=" * 50)
print()
print("한국어로 원하는 음악 스타일을 입력하세요.")
print("예: 공부할 때 듣기 좋은 잔잔한 피아노 곡")
print("예: 신나는 락 기타 연주")
print()

# 2. 사용자 입력
user_input = input("어떤 음악을 만들까요? : ").strip()
if not user_input:
    user_input = "밝고 경쾌한 어쿠스틱 기타 곡"

print()
print(f"입력: {user_input}")

# 3. 한국어 -> 영어 프롬프트 변환 (Gemini Flash)
print("AI가 영문 프롬프트로 변환 중...")
try:
    tr = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=(
            "Translate the following Korean music description into a detailed English prompt "
            "for an AI music generator. Focus on instruments, mood, tempo, and genre. "
            "Return only the English prompt text, nothing else.\n\n"
            f"Korean: {user_input}"
        )
    )
    english_prompt = tr.text.strip()
    print(f"변환된 프롬프트: {english_prompt}")
except Exception as e:
    print(f"번역 오류 (원문 사용): {e}")
    english_prompt = user_input

# 4. Lyria 음악 생성
print()
print("음악 생성 중입니다. 약 1분 정도 소요됩니다...")
try:
    response = client.models.generate_content(
        model="lyria-3-clip-preview",
        contents=english_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO", "TEXT"],
        ),
    )

    audio_data = None
    for part in response.parts:
        if part.text is not None:
            print(f"\n생성된 가사/설명:\n{part.text}")
        elif part.inline_data is not None:
            audio_data = part.inline_data.data

    if audio_data:
        out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clip.mp3")
        with open(out_path, "wb") as f:
            f.write(audio_data)
        print()
        print(f"성공! 파일이 저장되었습니다.")
        print(f"저장 위치: {out_path}")
    else:
        print("오디오 데이터를 받지 못했습니다.")

except Exception as e:
    print(f"음악 생성 오류: {e}")
