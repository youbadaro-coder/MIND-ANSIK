import http.server
import socketserver
import webbrowser
import threading
import os
import time

PORT = 8000
DIRECTORY = r"C:\ai작업\anti\0409"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"[*] ANNIE CORE Server started at http://localhost:{PORT}")
        print("[*] DO NOT CLOSE THIS WINDOW while using the AI Studio.")
        httpd.serve_forever()

if __name__ == "__main__":
    # Start server in a thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait a moment for server to initialize
    time.sleep(1.5)
    
    # Open browser
    print("[*] Opening your browser...")
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Keep the main process alive to maintain the server
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Server shutting down.")
