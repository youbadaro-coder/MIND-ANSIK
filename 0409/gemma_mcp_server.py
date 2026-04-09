import sys
import json
import requests
from duckduckgo_search import DDGS

# Ollama OpenAI-compatible endpoint
TARGET_URL = "http://localhost:11434/v1"

def search_web(query):
    print(f"[*] Searching latest data for: {query}", file=sys.stderr)
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nSource: {r['href']}")
    except Exception as e:
        print(f"[!] Search error: {e}", file=sys.stderr)
    return "\n\n".join(results)

def ask_gemma4(prompt):
    try:
        # Fetch latest data from web
        search_results = search_web(prompt)
        system_context = "You are a helpful AI assistant. Answer concisely."
        if search_results:
            system_context += f"\n\n[Latest Web Context]\n{search_results}\n\nBased on the above latest search results, please provide an up-to-date answer."

        payload = {
            "model": "gemma4:e4b",
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "stream": False
        }
        response = requests.post(f"{TARGET_URL}/chat/completions", json=payload, timeout=180)
        if response.ok:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            return f"Error from local model: {response.status_code} - {response.text}"
    except Exception as e:
        return f"failed to connect to local model: {str(e)}"

def process_message(message):
    try:
        request = json.loads(message)
        method = request.get("method")
        msg_id = request.get("id")

        if method == "initialize":
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "gemma-mcp-server",
                        "version": "1.1.0"
                    }
                }
            }
        elif method == "tools/list":
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "tools": [
                        {
                            "name": "ask_gemma4",
                            "description": "Ask the local Gemma-4 model. Now supports real-time web search for latest data.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "prompt": {"type": "string", "description": "The question or task for Gemma-4"}
                                },
                                "required": ["prompt"]
                            }
                        }
                    ]
                }
            }
        elif method == "tools/call":
            params = request.get("params", {})
            name = params.get("name")
            arguments = params.get("arguments", {})
            
            if name == "ask_gemma4":
                prompt = arguments.get("prompt")
                result = ask_gemma4(prompt)
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": result}
                        ]
                    }
                }
            else:
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {"code": -32601, "message": "Method not found"}
                }
        else:
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {}
            }
        
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()

    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.stderr.flush()

if __name__ == "__main__":
    for line in sys.stdin:
        if line.strip():
            process_message(line)
