import re
import os

log_path = r'c:\Users\laksh\.gemini\antigravity\brain\c1426e56-5190-4762-87ab-787219cfb30c\.system_generated\logs\overview.txt'
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf8') as f:
        log = f.read()
    
    # Try to find the optimized HTML content
    # Look for the last occurrence of the pattern to get the most updated version
    print(f"Log length: {len(log)}")
    pattern = r'\"ReplacementContent\":\"\\\"(<canvas id.*?<\\\\\\/script>)\\\"'
    matches = list(re.finditer(pattern, log, re.DOTALL))
    if matches:
        content = matches[-1].group(1)
        # Unescape the JSON string
        content = content.replace('\\\\n', '\n').replace('\\\\\\"', '"').replace('\\\\t', '\t').replace('\\\\/', '/')
        print(content)
    else:
        print("Not found")
else:
    print(f"Log path not found: {log_path}")
