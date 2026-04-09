from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
from duckduckgo_search import DDGS
import requests
import json

app = Flask(__name__)
CORS(app)

def search_web(query):
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}")
    except Exception: pass
    return "\n\n".join(results)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    target_url = data.get('target_url', 'http://localhost:11434/v1/chat/completions')
    
    search_context = ""
    if data.get('use_search'):
        search_context = f"\n\n[Search Context]\n{search_web(query)}"

    payload = {
        "model": data.get('model', 'gemma4:e4b'),
        "messages": [
            {"role": "system", "content": data.get('system_prompt', '') + search_context},
            {"role": "user", "content": query}
        ],
        "stream": True
    }

    def generate():
        with requests.post(target_url, json=payload, stream=True) as r:
            for line in r.iter_lines():
                if line: yield line + b"\n"

    return Response(stream_with_context(generate()), content_type='text/event-stream')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
