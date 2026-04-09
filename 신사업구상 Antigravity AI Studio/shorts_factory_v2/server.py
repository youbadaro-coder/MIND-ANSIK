"""
server.py - Shorts Factory V2 Backend (Multi-Job Queue Architecture)
=====================================================================
- 각 영상 작업은 고유한 job_id를 받습니다.
- 작업은 큐에 쌓이고 순서대로 하나씩 처리됩니다.
- /api/queue: 전체 큐 상태 조회
- /api/queue/add: 새 작업 추가
- /api/status/<job_id>: 특정 작업 로그 폴링
- /video/<job_id>: 특정 작업 영상 다운로드
"""

import os
import subprocess
import sys
import json
import uuid
import queue
import threading
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
BIN_PYTHON = sys.executable
TMP_DIR    = os.path.join(BASE_DIR, ".tmp")
os.makedirs(TMP_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# Multi-Job Queue State
# ─────────────────────────────────────────────────────────────────────────────

_lock     = threading.Lock()
_job_queue = queue.Queue()   # FIFO queue of job dicts
_jobs     = {}               # job_id -> job state dict

def _make_job(job_id, topic, category, style, persona, format_type, orientation):
    return {
        "job_id":      job_id,
        "topic":       topic,
        "format":      format_type,
        "status":      "pending",   # pending | running | done | error
        "messages":    [],
        "cursor":      0,
        "error":       None,
    }

def _push(job_id, msg):
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["messages"].append(msg)

def _run_script(job_id, script_path, args=None):
    cmd = [BIN_PYTHON, script_path]
    if args:
        cmd.extend([str(a) for a in args])

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"

    # Each job writes output to its own subdirectory
    job_tmp = os.path.join(TMP_DIR, job_id)
    os.makedirs(job_tmp, exist_ok=True)
    env["JOB_TMP_DIR"] = job_tmp

    _push(job_id, f"[실행중] {os.path.basename(script_path)}")
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            cwd=BASE_DIR,
            env=env,
        )
        for raw in iter(process.stdout.readline, b""):
            line = raw.decode("utf-8", errors="replace").rstrip()
            if line:
                _push(job_id, line)
        process.stdout.close()
        rc = process.wait()
        _push(job_id, f"[완료] {os.path.basename(script_path)} (exit={rc})")
        return rc == 0
    except Exception as e:
        _push(job_id, f"[에러] {e}")
        return False

def _pipeline_worker(job):
    job_id      = job["job_id"]
    topic       = job["topic"]
    category    = job.get("category", "Touching")
    style       = job.get("style", "Cinematic")
    persona     = job.get("persona", "kodari")
    format_type = job.get("format", "short")
    orientation = job.get("orientation", "portrait")

    with _lock:
        _jobs[job_id]["status"] = "running"

    try:
        _push(job_id, f"🚀 [{format_type.upper()}] '{topic[:30]}...' 작업 시작!")

        # STEP 1: Script
        _push(job_id, "📝 [STEP 1] 대본 작성 중...")
        ok = _run_script(job_id, os.path.join(BASE_DIR, "execution", "research_topic.py"),
                         [category, topic, style, format_type, orientation])
        if not ok:
            _push(job_id, "❌ 대본 작성 실패")
            with _lock:
                _jobs[job_id]["status"] = "error"
            return

        # STEP 2: Materials
        _push(job_id, "🎬 [STEP 2] 영상 소스 수집 중...")
        _run_script(job_id, os.path.join(BASE_DIR, "execution", "fetch_materials.py"))

        # STEP 3: Render
        _push(job_id, "✂️ [STEP 3] 나레이션 & 영상 렌더링 중...")
        ok = _run_script(job_id, os.path.join(BASE_DIR, "execution", "edit_video.py"))
        if not ok:
            _push(job_id, "❌ 영상 렌더링 실패")
            with _lock:
                _jobs[job_id]["status"] = "error"
            return

        _push(job_id, "✅ 완성! 영상 탭에서 결과를 확인하세요!")
        with _lock:
            _jobs[job_id]["status"] = "done"

    except Exception as e:
        import traceback
        traceback.print_exc()
        _push(job_id, f"❌ 오류: {e}")
        with _lock:
            _jobs[job_id]["status"] = "error"

def _queue_worker():
    """Runs forever, processing one job at a time from the queue."""
    while True:
        job = _job_queue.get()
        try:
            _pipeline_worker(job)
        finally:
            _job_queue.task_done()

# Start single queue consumer thread
_worker_thread = threading.Thread(target=_queue_worker, daemon=True)
_worker_thread.start()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/app.js")
def serve_js():
    return send_from_directory(BASE_DIR, "app.js")

@app.route("/styles.css")
def serve_css():
    return send_from_directory(BASE_DIR, "styles.css")


# ── Legacy single-generate (backwards compat) ──
@app.route("/api/generate", methods=["POST"])
def generate():
    data        = request.json or {}
    topic       = data.get("topic", "")
    category    = data.get("category", "Touching")
    style       = data.get("style", "Cinematic")
    persona     = data.get("persona", "kodari")
    format_type = data.get("format", "short")
    orientation = data.get("orientation", "portrait")

    job_id = str(uuid.uuid4())[:8]
    job    = _make_job(job_id, topic, category, style, persona, format_type, orientation)
    job.update({"category": category, "style": style, "persona": persona, "orientation": orientation})

    with _lock:
        _jobs[job_id] = job

    _job_queue.put(job)
    return jsonify({"ok": True, "job_id": job_id, "queue_position": _job_queue.qsize()})


# ── New Queue API ──
@app.route("/api/queue/add", methods=["POST"])
def queue_add():
    """Add one or more jobs to the queue."""
    data = request.json or {}
    items = data.get("items", [])
    if not items:
        # Support single item sent without wrapper
        items = [data]

    added = []
    for item in items:
        topic       = item.get("topic", "")
        category    = item.get("category", "Touching")
        style       = item.get("style", "Cinematic")
        persona     = item.get("persona", "kodari")
        format_type = item.get("format", "short")
        orientation = item.get("orientation", "portrait")

        job_id = str(uuid.uuid4())[:8]
        job    = _make_job(job_id, topic, category, style, persona, format_type, orientation)
        job.update({"category": category, "style": style, "persona": persona, "orientation": orientation})

        with _lock:
            _jobs[job_id] = job

        _job_queue.put(job)
        added.append({"job_id": job_id, "topic": topic, "format": format_type})

    return jsonify({"ok": True, "added": added, "queue_size": _job_queue.qsize()})


@app.route("/api/queue", methods=["GET"])
def queue_status():
    """Return all jobs and their status."""
    with _lock:
        jobs_snapshot = [
            {
                "job_id":  j["job_id"],
                "topic":   j["topic"],
                "format":  j["format"],
                "status":  j["status"],
            }
            for j in _jobs.values()
        ]
    return jsonify({"jobs": jobs_snapshot})


@app.route("/api/status", methods=["GET"])
def status_legacy():
    """Legacy polling: returns status of most recent job."""
    with _lock:
        if not _jobs:
            return jsonify({"running": False, "done": False, "error": None, "messages": []})
        latest = list(_jobs.values())[-1]
        job_id  = latest["job_id"]
        running = latest["status"] == "running"
        done    = latest["status"] == "done"
        error   = latest["error"]
        cursor  = latest["cursor"]
        msgs    = latest["messages"]

    new_msgs = msgs[cursor:]
    with _lock:
        _jobs[job_id]["cursor"] = cursor + len(new_msgs)

    return jsonify({"running": running, "done": done, "error": error, "messages": new_msgs})


@app.route("/api/status/<job_id>", methods=["GET"])
def status_job(job_id):
    """Per-job polling endpoint."""
    with _lock:
        job = _jobs.get(job_id)
    if not job:
        return jsonify({"error": "job not found"}), 404

    cursor   = job["cursor"]
    new_msgs = job["messages"][cursor:]
    with _lock:
        _jobs[job_id]["cursor"] = cursor + len(new_msgs)

    return jsonify({
        "job_id":  job_id,
        "topic":   job["topic"],
        "format":  job["format"],
        "status":  job["status"],
        "messages": new_msgs,
    })


@app.route("/video")
def get_video_legacy():
    return send_from_directory(TMP_DIR, "final_video.mp4")


@app.route("/video/<job_id>")
def get_video_job(job_id):
    job_dir = os.path.join(TMP_DIR, job_id)
    return send_from_directory(job_dir, "final_video.mp4", as_attachment=True)


if __name__ == "__main__":
    print("Starting server at http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
