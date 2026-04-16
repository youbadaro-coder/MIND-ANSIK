import os
import sys
import json

# Ensure NotebookLM MCP library is accessible
try:
    from notebooklm_mcp.api_client import NotebookLMClient
    
    print("Connecting to NotebookLM API...")
    
    # Manually load and parse auth.json since formats differ between Node and Python
    auth_path = os.path.expanduser("~/.notebooklm-mcp/auth.json")
    if not os.path.exists(auth_path):
        print(f"Error: {auth_path} not found.")
        sys.exit(1)
        
    with open(auth_path, 'r') as f:
        auth_data = json.load(f)
        
    raw_cookies = auth_data.get("cookies", "")
    if isinstance(raw_cookies, str):
        # Parse cookie string into dict
        cookie_dict = {}
        for item in raw_cookies.split(';'):
            if '=' in item:
                k, v = item.strip().split('=', 1)
                cookie_dict[k] = v
        cookies = cookie_dict
    else:
        cookies = raw_cookies

    # Initialize client with parsed cookies
    client = NotebookLMClient(cookies=cookies)
    
    # Try to list notebooks
    notebooks = client.list_notebooks()
    
    if not notebooks:
        print("Successfully connected, but no notebooks were found in this account.")
    else:
        print(f"Successfully connected! Found {len(notebooks)} notebooks:")
        print("="*50)
        for nb in notebooks:
            title = nb.title if hasattr(nb, 'title') else nb.get('title', 'Untitled')
            nb_id = nb.id if hasattr(nb, 'id') else nb.get('id', 'No ID')
            print(f"- {title} (ID: {nb_id})")
        print("="*50)
        
except Exception as e:
    print(f"Verification FAILED: {str(e)}")
    # Print more debug info
    import traceback
    traceback.print_exc()
    sys.exit(1)
