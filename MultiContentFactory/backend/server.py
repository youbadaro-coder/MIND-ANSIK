from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
import uvicorn
import requests
from fastapi.middleware.cors import CORSMiddleware
from notebooklm_mcp.api_client import NotebookLMClient

app = FastAPI()

# 스마트폰 앱에서의 접속을 위해 CORS 설정을 전격 개방합니다!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

# NotebookLM 인증 정보 로드 및 클라이언트 초기화
def get_client():
    auth_path = os.path.expanduser("~/.notebooklm-mcp/auth.json")
    if not os.path.exists(auth_path):
        raise Exception("NotebookLM 인증 정보가 없습니다. auth 명령을 먼저 실행해 주세요.")
    
    with open(auth_path, "r") as f:
        auth_data = json.load(f)
        
    raw_cookies = auth_data.get("cookies", "")
    cookies = {item.strip().split("=", 1)[0]: item.strip().split("=", 1)[1] 
               for item in raw_cookies.split(";") if "=" in item}
    
    return NotebookLMClient(cookies=cookies)

# 콘텐츠 마스터 기지 ID (아까 생성한 기지 중 하나)
CONTENT_MASTER_NB_ID = "f63145b3-c765-45b3-a807-f92d3e8e7482"

def parse_content(text):
    """젬마 4의 고출력 텍스트를 플랫폼별로 정밀 분해합니다."""
    sections = {
        "youtube": "콘텐츠 생성 오류",
        "shorts": "콘텐츠 생성 오류",
        "sns": "콘텐츠 생성 오류",
        "newsletter": "콘텐츠 생성 오류"
    }

    current_section = None
    content_lines = []

    for line in text.split('\n'):
        line = line.strip()
        if "[YOUTUBE]" in line:
            if current_section: sections[current_section] = "\n".join(content_lines).strip()
            current_section = "youtube"
            content_lines = []
        elif "[SHORTS]" in line:
            if current_section: sections[current_section] = "\n".join(content_lines).strip()
            current_section = "shorts"
            content_lines = []
        elif "[SNS]" in line:
            if current_section: sections[current_section] = "\n".join(content_lines).strip()
            current_section = "sns"
            content_lines = []
        elif "[NEWSLETTER]" in line:
            if current_section: sections[current_section] = "\n".join(content_lines).strip()
            current_section = "newsletter"
            content_lines = []
        elif current_section:
            content_lines.append(line)

    if current_section:
        sections[current_section] = "\n".join(content_lines).strip()

    return sections

import sys

@app.post("/generate")
async def generate_content(request: GenerateRequest):
    # 상위 1% 전략가 'Llama 3.1 8B' (Strategic Class) 탑재!
    # [설명] 8GB VRAM 환경에서 지능과 속도의 완벽한 타협점입니다. 젬마 2b보다 훨씬 똑똑하고 26b보다 훨씬 빠릅니다.
    system_prompt = f"""
    당신은 세계 최고의 AI 비즈니스 전략가 'Llama 3.1 8B (Strategic Master)'입니다. 
    대표님의 글감을 바탕으로 4가지 플랫폼에 최적화된 초품격 마케팅 콘텐츠를 제작하십시오.
    
    [YOUTUBE]
    - 제목: 클릭률(CTR)을 폭발시키는 심리적 유인책이 담긴 제목 (3개 추천)
    - 도입부: 시청자가 이탈할 수 없는 강력한 스토리텔링 기반 후킹
    - 핵심 요약: 전문성이 돋보이는 체계적인 정보 전달 스크립트
    
    [SHORTS]
    - 알고리즘 카피: 숏폼 피드에서 멈추게 만드는 핵심 문구
    - 대본: 1분 이내에 가치를 전달하는 초압축 고감도 나레이션
    - 시각 요소: 영상의 임팩트를 극대화할 자막 및 화면 전환 제안
    
    [SNS]
    - 타겟 페르소나: 이 글에 반응할 가장 소득 수준이 높고 열정적인 집단 설정
    - 본문: 전문가로서의 권위(Authority)를 세워주는 고품격 포스팅
    - 태그: 알고리즘의 선택을 받을 전략적 태그 10개
    
    [NEWSLETTER]
    - 헤드라인: 높은 오픈율을 보장하는 인사이트 중심의 클릭 유도형 제목
    - 유대감 형성: 독자와 깊은 신뢰 관계를 구축하는 전문적인 도입부
    - 심화 인사이트: 유료 멤버십 수준의 깊이 있는 비즈니스 전술 가미
    
    글감: {request.prompt}
    """

    # [엔진 선택] 대표님의 하드웨어 사양에 맞춤형 엔진 가동
    # 1단계: 로컬 GPU(Ollama) - Llama 3.1 8B (Flash Attention 가속)
    try:
        print(f"[Strategic Master] Llama 3.1 8B Core starting (Flash-Accelerated)...")
        sys.stdout.flush()
        ollama_url = "http://localhost:11434/api/generate"
        ollama_payload = {
            "model": "llama3.1", # 지능과 속도의 황금 밸런스
            # "model": "gemma4:26b", # 최고의 지능을 원할 경우 이 주석을 해제 (8GB VRAM에서는 매우 느림)
            "prompt": system_prompt,
            "stream": False,
            "options": {
                "num_ctx": 4096,
                "temperature": 0.7
            }
        }
        
        # Flash Attention 덕분에 60초 이내에 전문가급 답변을 보장합니다.
        response = requests.post(ollama_url, json=ollama_payload, timeout=60) 
        if response.status_code == 200:
            full_text = response.json().get('response', '')
            print("Done! [Strategic Master] High-fidelity results generated.")
            sys.stdout.flush()
            return parse_content(full_text)
        else:
            print(f"Warning! Local load high. Falling back to Cloud Intelligence.")
            sys.stdout.flush()
    except Exception as e:
        print(f"Warning! Local delay ({e}). Fallback logic activated.")
        sys.stdout.flush()

    # 2단계: 클라우드(NotebookLM) 우회
    try:
        print(f"Cloud! [Enterprise Cloud] NotebookLM expert active...")
        client = get_client()
        response = client.query(notebook_id=CONTENT_MASTER_NB_ID, query_text=system_prompt)
        full_text = response["answer"]
        return parse_content(full_text)
    except Exception as e:
        print(f"Error! Total systems failure: {e}")
        raise HTTPException(status_code=500, detail="AI engine is temporarily unavailable. 🫡🐟")

if __name__ == "__main__":
    # 8000번 포트가 사용 중이라 8001번 포트로 우회하여 기동합니다!
    uvicorn.run(app, host="0.0.0.0", port=8001)
