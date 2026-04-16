import requests
import time
import json

def test_backend_performance():
    url = "http://127.0.0.1:8001/generate"
    payload = {"prompt": "AI 1인 기업으로 한 달에 1000만원 버는 전략을 가르쳐줘."}
    
    print("\n[Gemma 4 Intel] Performance Test Starting...")
    
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, timeout=60)
        end_time = time.time()
        
        if response.status_code == 200:
            latency = end_time - start_time
            print(f"Success! Latency: {latency:.2f}s")
            
            data = response.json()
            print("\nGenerated Content Summary:")
            for platform, content in data.items():
                short_content = str(content)[:50].replace('\n', ' ')
                print(f"- [{platform.upper()}]: {short_content}...")
                
            return latency
        else:
            print(f"Test Failed (Code: {response.status_code})")
            return None
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

if __name__ == "__main__":
    test_backend_performance()
