import os
import subprocess
import sys
import json
import uuid
import queue
import threading
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load ENV
load_dotenv()

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BIN_PYTHON = sys.executable
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(BASE_DIR), "output")
TMP_DIR = os.path.join(BASE_DIR, ".tmp")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# Queue Manager
# -----------------------------------------------------------------------------

_lock = threading.Lock()
_job_queue = queue.Queue()
_jobs = {}  # job_id -> state

def _make_job(job_id, topic, params):
    return {
        "job_id": job_id,
        "topic": topic,
        "params": params,
        "status": "pending",  # pending | running | done | error
        "progress": 0,
        "logs": [],
        "result_url": None,
        "created_at": time.time(),
        "started_at": None,
        "finished_at": None
    }

def _log(job_id, msg):
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["logs"].append({
                "time": time.time(),
                "msg": msg
            })
            print(f"[{job_id}] {msg}")

def _run_script(job_id, script_name, args=None):
    script_path = os.path.join(BASE_DIR, "execution", script_name)
    cmd = [BIN_PYTHON, script_path]
    if args:
        cmd.extend([str(a) for a in args])

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["JOB_TMP_DIR"] = os.path.join(TMP_DIR, job_id)
    os.makedirs(env["JOB_TMP_DIR"], exist_ok=True)

    _log(job_id, f"Running {script_name}...")
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            cwd=BASE_DIR,
            env=env
        )
        for line in iter(process.stdout.readline, ""):
            if line:
                _log(job_id, line.strip())
        process.stdout.close()
        rc = process.wait()
        return rc == 0
    except Exception as e:
        _log(job_id, f"Execution Error: {str(e)}")
        return False

def _pipeline_worker(job):
    job_id = job["job_id"]
    with _lock:
        _jobs[job_id]["status"] = "running"
        _jobs[job_id]["started_at"] = time.time()
    
    _log(job_id, "🚀 Starting production pipeline...")
    
    # Step 1: Research & Script
    with _lock: _jobs[job_id]["progress"] = 10
    ok = _run_script(job_id, "research_topic.py", [
        job["params"].get("category", ""),
        job["topic"],
        job["params"].get("style", ""),
        job["params"].get("format", "short"),
        job["params"].get("orientation", "portrait")
    ])
    if not ok:
        with _lock: 
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["finished_at"] = time.time()
        return

    # Step 2: Fetch Materials
    with _lock: _jobs[job_id]["progress"] = 40
    ok = _run_script(job_id, "fetch_materials.py")
    if not ok:
        with _lock: 
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["finished_at"] = time.time()
        return

    # Step 3: Render Video
    with _lock: _jobs[job_id]["progress"] = 70
    ok = _run_script(job_id, "edit_video.py")
    if not ok:
        with _lock: 
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["finished_at"] = time.time()
        return

    # Success
    with _lock:
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["progress"] = 100
        _jobs[job_id]["finished_at"] = time.time()
        _jobs[job_id]["result_url"] = f"/output/{job_id}/final_video.mp4"
    
    # Copy final result to output dir
    res_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(res_dir, exist_ok=True)
    src = os.path.join(TMP_DIR, job_id, "final_video.mp4")
    if os.path.exists(src):
        import shutil
        shutil.copy(src, os.path.join(res_dir, "final_video.mp4"))
    
    _log(job_id, "✅ Pipeline complete!")

def _queue_worker():
    while True:
        job = _job_queue.get()
        try:
            _pipeline_worker(job)
        finally:
            _job_queue.task_done()

# Start Worker
threading.Thread(target=_queue_worker, daemon=True).start()

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@app.route("/")
def home():
    return jsonify({"service": "Shorts Factory Pro API", "status": "online"})

@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json or {}
    topic = data.get("topic", "Top 5 Space Facts")
    params = data.get("params", {})
    
    job_id = str(uuid.uuid4())[:8]
    job = _make_job(job_id, topic, params)
    
    with _lock:
        _jobs[job_id] = job
    
    _job_queue.put(job)
    return jsonify({"ok": True, "job_id": job_id})

@app.route("/api/status/<job_id>")
def status(job_id):
    with _lock:
        job = _jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Calculate times
    now = time.time()
    elapsed = 0
    remaining = 0
    
    if job["started_at"]:
        end = job["finished_at"] or now
        elapsed = int(end - job["started_at"])
        
        # Estimation logic
        if job["status"] == "running":
            prog = job["progress"]
            # Base estimates (total)
            if prog <= 10: base = 150
            elif prog <= 40: base = 120
            else: base = 90
            remaining = max(0, base - elapsed)
        elif job["status"] == "pending":
            remaining = 150
            
    res = dict(job)
    res["time_metrics"] = {
        "elapsed": elapsed,
        "remaining": remaining
    }
    return jsonify(res)

@app.route("/api/trends")
def discovery():
    # Attempt to fetch real-time trends via AI Synthesis
    prompt = """
    Research and find exactly 15 trending topics in South Korea today (2026-04-16) for YouTube Shorts.
    Provide 5 topics for each of these categories:
    1. Google Trends (Search interest)
    2. Naver News (Headline ranking)
    3. YouTube Viral (Trending/High view counts)

    [RULES]
    - Topics must be in Korean.
    - Each topic should be a catchy, clickbait-style title (e.g., instead of 'Inflation', use '물가 폭등, 이제 떡볶이 한 그릇에 2만원?!').
    - Return ONLY valid JSON in this format:
    {
        "google": ["topic1", "topic2", ...],
        "naver": [...],
        "youtube": [...]
    }
    """
    try:
        from ai_router import generate_with_fallback
        raw, _ = generate_with_fallback(prompt)
        
        # Clean JSON
        raw = raw.strip()
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        data = json.loads(raw)
        return jsonify({"ok": True, "trends": data})
    except Exception as e:
        # Fallback to pre-searched data if AI fails
        fallback = {
            "google": [
                "서울 아파트값 62주 연속 상승, 내 집 마련 포기해야 할까?",
                "한컴타자 판뒤집기 대항전, 당신의 타자 실력은 몇 위?",
                "구글 지도 격렬비열도 오표기 논란, 서해 영토 수호 비상",
                "LG화학 대규모 희망퇴직 실시, 산업계에 부는 칼바람",
                "삼성·LG의 인도-베트남 투자 전쟁, 승자는 누가 될 것인가?"
            ],
            "naver": [
                "도이치모터스 간판 드디어 철거? 끈질긴 시정 조치 비화",
                "이재용·구광모의 글로벌 광폭 행보, 한국 경제의 미래는?",
                "한화토탈 불가항력 선언, 원유 수급 대란 오나?",
                "자폐아 부모들의 눈물겨운 사투, 우리 사회의 현주소",
                "재보선 단일화 압박, 정치권의 숨막히는 눈치 싸움"
            ],
            "youtube": [
                "국회 청문회 레전드 영상, 속 시원한 사이다 발언 모음",
                "잠 못 드는 밤을 위한 역대급 빗소리 ASMR (고화질 4K)",
                "2026년 대예측, 지금 당장 사야 할 주식 TOP 3",
                "AI로 돈 버는 법, 하루 1시간 투자로 월 300만원?!",
                "신동엽도 당황케 한 미친 드립력, 인기 예능 하이라이트"
            ]
        }
        return jsonify({"ok": True, "trends": fallback, "fallback": True})

@app.route("/api/jobs")
def list_jobs():
    with _lock:
        return jsonify(list(_jobs.values()))

@app.route("/output/<path:filename>")
def serve_output(filename):
    return send_from_directory(OUTPUT_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)
