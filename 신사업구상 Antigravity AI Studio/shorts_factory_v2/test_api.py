import requests

payload = {
    "topic": "business",
    "format": "short",
    "orientation": "portrait"
}

print("Sending request...")
response = requests.post("http://127.0.0.1:5000/api/generate", json=payload, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
print("Done.")
