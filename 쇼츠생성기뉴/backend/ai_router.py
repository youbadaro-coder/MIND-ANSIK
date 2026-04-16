import os
import sys
import json
import requests
from dotenv import load_dotenv

# Force UTF-8 output to avoid cp949 encode errors on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

load_dotenv()

# ─────────────────────────────────────────────────────────
# Model Definitions (ordered by priority: free first)
# ─────────────────────────────────────────────────────────

MODELS = [
    {
        "name": "gemini-2.0-flash",
        "provider": "gemini",
        "label": "Gemini 2.0 Flash (Free)",
        "free": True,
    },
    {
        "name": "gemini-1.5-flash",
        "provider": "gemini",
        "label": "Gemini 1.5 Flash",
        "free": True,
    },
    {
        "name": "gemma4:e4b",
        "provider": "ollama",
        "label": "Gemma4 Local (Unlimited)",
        "free": True,
    },
]

# ─────────────────────────────────────────────────────────
# Provider Implementations
# ─────────────────────────────────────────────────────────

def _call_gemini(model_name: str, prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    from google import genai
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name,
        contents=prompt
    )
    return response.text

def _call_ollama(model_name: str, prompt: str) -> str:
    body = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
    }
    # Using a shorter timeout for local model to fail fast if not running
    resp = requests.post("http://localhost:11434/api/generate", json=body, timeout=300)
    resp.raise_for_status()
    return resp.json()["response"]

# ─────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────

def generate_with_fallback(prompt: str, log_fn=None) -> tuple[str, str]:
    """
    Try each model in priority order. Returns (response_text, model_label).
    Falls back to the next model on quota/auth errors.
    Always succeeds by falling back to local Gemma4.
    """
    def log(msg):
        # Ensure message is printable even on restricted terminals
        safe_msg = msg.encode('utf-8', errors='replace').decode('utf-8')
        if log_fn:
            log_fn(safe_msg)
        else:
            print(safe_msg, flush=True)

    for model in MODELS:
        label = model["label"]
        try:
            log(f"[AI] Attempting with {label}...")
            provider = model["provider"]
            name = model["name"]

            if provider == "gemini":
                result = _call_gemini(name, prompt)
            elif provider == "ollama":
                result = _call_ollama(name, prompt)
            else:
                continue

            log(f"[AI] Success with {label}!")
            return result, label

        except Exception as e:
            err = str(e).lower()
            # Detect quota/auth issues to fall back
            quota_keywords = ["quota", "429", "limit", "exhausted", "not set", "unauthorized", "refused"]
            if any(k in err for k in quota_keywords):
                log(f"[AI] {label} quota reached or unavailable. Falling back...")
                continue
            else:
                log(f"[AI] {label} error: {err[:100]}. Trying next...")
                continue

    raise RuntimeError("All AI models unavailable. Please check if Ollama is running.")

if __name__ == "__main__":
    try:
        result, model = generate_with_fallback("Hello! Say 'test ok' in Korean.")
        print(f"\nFinal Model Used: {model}")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Fatal Error: {e}")
